import { Platform } from "react-native";
import {
  isDesktopWeb,
  refineDesktopCheckinLocation,
  type CurrentLocation,
  type PreciseLocationAnchor,
} from "@/lib/get-current-location";

export type CheckinFix = {
  lat: number;
  lng: number;
  accuracy?: number;
  observedAt: number;
};

export type CheckinLocationResult =
  | { kind: "accepted"; fix: CheckinFix }
  | { kind: "review"; fix: CheckinFix };

export type CheckinLocationEnvironment = "mobile" | "desktop-web";

export type CheckinWarmupSession = {
  stop: () => void;
};

const WEB_FAST: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 300_000,
  timeout: 10_000,
};

const WEB_ACCURATE: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 25_000,
};

const WEB_ACCURATE_DELAY_MS = 500;
const EVALUATION_TICK_MS = 500;
const MOBILE_HARD_CUT_MS = 10_000;
const DESKTOP_HARD_CUT_MS = 8_000;
const PREWARM_MAX_AGE_MS = 20_000;
const WARMUP_MAX_DURATION_MS = 12_000;

type GeoLike = {
  getCurrentPosition: (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ) => void;
  watchPosition: (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ) => number;
  clearWatch: (watchId: number) => void;
};

type MutableSessionState = {
  settled: boolean;
  best: CheckinFix | null;
};

function toCheckinFix(pos: GeolocationPosition): CheckinFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    observedAt: Date.now(),
  };
}

function toCheckinFixFromNative(pos: {
  coords: { latitude: number; longitude: number; accuracy?: number | null };
}): CheckinFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? undefined,
    observedAt: Date.now(),
  };
}

function applyAnchors(fix: CheckinFix, anchors: PreciseLocationAnchor[]): CheckinFix {
  if (anchors.length === 0) return fix;
  const refined = refineDesktopCheckinLocation(
    { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy },
    anchors,
  );
  return {
    lat: refined.lat,
    lng: refined.lng,
    accuracy: refined.accuracy,
    observedAt: fix.observedAt,
  };
}

function isBetterFix(candidate: CheckinFix, current: CheckinFix | null): boolean {
  if (!current) return true;
  const candidateAccuracy = candidate.accuracy ?? Number.POSITIVE_INFINITY;
  const currentAccuracy = current.accuracy ?? Number.POSITIVE_INFINITY;
  if (candidateAccuracy !== currentAccuracy) return candidateAccuracy < currentAccuracy;
  return candidate.observedAt > current.observedAt;
}

export function getCheckinEnvironment(): CheckinLocationEnvironment {
  return Platform.OS === "web" && isDesktopWeb() ? "desktop-web" : "mobile";
}

export function evaluateCheckinFix(
  fix: CheckinFix,
  elapsedMs: number,
  environment: CheckinLocationEnvironment,
  hardCut = false,
): CheckinLocationResult | null {
  const accuracy = fix.accuracy ?? Number.POSITIVE_INFINITY;

  if (environment === "desktop-web") {
    if (accuracy <= 35) return { kind: "accepted", fix };
    if (hardCut || elapsedMs >= DESKTOP_HARD_CUT_MS) return { kind: "review", fix };
    return null;
  }

  if (accuracy <= 25) return { kind: "accepted", fix };
  if (elapsedMs >= 3_000 && accuracy <= 80) return { kind: "accepted", fix };
  if (elapsedMs >= 6_000 && accuracy <= 150) return { kind: "accepted", fix };
  if (hardCut || elapsedMs >= MOBILE_HARD_CUT_MS) {
    if (accuracy <= 100) return { kind: "accepted", fix };
    if (accuracy <= 10_000) return { kind: "review", fix };
  }

  return null;
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 1
  );
}

function unavailableError(): Error {
  return new Error("この端末では位置情報を取得できません");
}

function permissionError(): Error {
  return new Error("位置情報の許可が必要です");
}

function timeoutError(): Error {
  return new Error(
    "位置情報を取得できませんでした。ブラウザの位置情報を許可するか、スマホでお試しください。",
  );
}

const ANCHOR_FALLBACK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * 測位が1件も取れなかった時の最終フォールバック:
 * 直近の高精度足あと（アンカー）を「レビュー用の仮位置」として返す。
 * PCで位置情報サービスが使えない環境でも、地図ピン修正から保存へ進めるようにする
 * （エラー行き止まりにしない。2026-07-04 実走で発覚した欠陥の修正）。
 */
export function anchorFallbackFix(anchors: PreciseLocationAnchor[]): CheckinFix | null {
  const now = Date.now();
  const valid = anchors.filter((a) => {
    if (a.accuracyM == null) return false;
    const age = now - new Date(a.recordedAt).getTime();
    return Number.isFinite(age) && age >= 0 && age <= ANCHOR_FALLBACK_MAX_AGE_MS;
  });
  if (valid.length === 0) return null;
  const best = [...valid].sort((a, b) => {
    const accDiff = (a.accuracyM ?? 999) - (b.accuracyM ?? 999);
    if (accDiff !== 0) return accDiff;
    return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
  })[0]!;
  return {
    lat: best.lat,
    lng: best.lng,
    accuracy: best.accuracyM ?? undefined,
    observedAt: now,
  };
}

function abortError(): Error {
  return new Error("位置情報の取得を中断しました");
}

function getWebGeolocation(): GeoLike | null {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return null;
  return navigator.geolocation ?? null;
}

function startWebSampling(options: {
  onSample: (fix: CheckinFix) => void;
  onError?: (error: GeolocationPositionError) => void;
  signal?: AbortSignal;
  maxDurationMs?: number;
}): CheckinWarmupSession | null {
  const geolocation = getWebGeolocation();
  if (!geolocation) return null;

  let watchId: number | null = null;
  let accurateTimer: ReturnType<typeof setTimeout> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (accurateTimer) clearTimeout(accurateTimer);
    if (maxTimer) clearTimeout(maxTimer);
    if (watchId != null) geolocation.clearWatch(watchId);
    options.signal?.removeEventListener("abort", stop);
    watchId = null;
    accurateTimer = null;
    maxTimer = null;
  };

  const push = (pos: GeolocationPosition) => {
    if (!stopped) options.onSample(toCheckinFix(pos));
  };

  const handleError = (error: GeolocationPositionError) => {
    if (!stopped) options.onError?.(error);
  };

  if (options.signal?.aborted) {
    stop();
    return null;
  }

  options.signal?.addEventListener("abort", stop);

  geolocation.getCurrentPosition(push, handleError, WEB_FAST);
  watchId = geolocation.watchPosition(push, handleError, WEB_ACCURATE);
  accurateTimer = setTimeout(() => {
    geolocation.getCurrentPosition(push, handleError, WEB_ACCURATE);
  }, WEB_ACCURATE_DELAY_MS);

  if (options.maxDurationMs != null) {
    maxTimer = setTimeout(stop, options.maxDurationMs);
  }

  return { stop };
}

async function acquireWebCheckinLocation(options: {
  preciseAnchors: PreciseLocationAnchor[];
  prewarmedFix?: CheckinFix | null;
  onProgress?: (best: CheckinFix) => void;
  signal?: AbortSignal;
}): Promise<CheckinLocationResult> {
  const geolocation = getWebGeolocation();
  if (!geolocation) throw unavailableError();

  const environment = getCheckinEnvironment();
  const hardCutMs = environment === "desktop-web" ? DESKTOP_HARD_CUT_MS : MOBILE_HARD_CUT_MS;
  const startedAt = Date.now();
  const state: MutableSessionState = { settled: false, best: null };

  return new Promise((resolve, reject) => {
    let session: CheckinWarmupSession | null = null;
    let hardTimer: ReturnType<typeof setTimeout> | null = null;
    let tickTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      session?.stop();
      if (hardTimer) clearTimeout(hardTimer);
      if (tickTimer) clearInterval(tickTimer);
      options.signal?.removeEventListener("abort", handleAbort);
      session = null;
      hardTimer = null;
      tickTimer = null;
    };

    const settle = (result: CheckinLocationResult) => {
      if (state.settled) return;
      state.settled = true;
      cleanup();
      resolve(result);
    };

    const fail = (error: Error) => {
      if (state.settled) return;
      state.settled = true;
      cleanup();
      reject(error);
    };

    const settleWithAnchorFallback = (): boolean => {
      const fallback = anchorFallbackFix(options.preciseAnchors);
      if (!fallback) return false;
      settle({ kind: "review", fix: fallback });
      return true;
    };

    const evaluate = (hardCut = false) => {
      if (!state.best) {
        if (hardCut && !settleWithAnchorFallback()) fail(timeoutError());
        return;
      }
      const elapsed = Date.now() - startedAt;
      const result = evaluateCheckinFix(state.best, elapsed, environment, hardCut);
      if (result) settle(result);
      else if (hardCut && !settleWithAnchorFallback()) fail(timeoutError());
    };

    const consider = (fix: CheckinFix) => {
      const refined = applyAnchors(fix, options.preciseAnchors);
      if (!isBetterFix(refined, state.best)) return;
      state.best = refined;
      options.onProgress?.(refined);
      evaluate(false);
    };

    const handleAbort = () => fail(abortError());

    if (options.signal?.aborted) {
      fail(abortError());
      return;
    }

    options.signal?.addEventListener("abort", handleAbort);

    if (
      options.prewarmedFix &&
      Date.now() - options.prewarmedFix.observedAt >= 0 &&
      Date.now() - options.prewarmedFix.observedAt < PREWARM_MAX_AGE_MS
    ) {
      consider(options.prewarmedFix);
      if (state.settled) return;
    }

    session = startWebSampling({
      signal: options.signal,
      onSample: consider,
      onError: (error) => {
        if (state.best) return;
        if (isPermissionDenied(error)) {
          fail(permissionError());
          return;
        }
        // PCで位置情報サービス自体が使えない (POSITION_UNAVAILABLE)。
        // ハードカットまで待たず、直近足あとがあれば即レビューへ降格する。
        if (environment === "desktop-web" && error.code === 2) {
          if (!settleWithAnchorFallback()) fail(timeoutError());
        }
      },
    });

    if (!session) {
      fail(unavailableError());
      return;
    }

    tickTimer = setInterval(() => evaluate(false), EVALUATION_TICK_MS);
    hardTimer = setTimeout(() => evaluate(true), hardCutMs);
  });
}

async function acquireNativeCheckinLocation(options: {
  preciseAnchors: PreciseLocationAnchor[];
  prewarmedFix?: CheckinFix | null;
  onProgress?: (best: CheckinFix) => void;
  signal?: AbortSignal;
}): Promise<CheckinLocationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Location = (await import("expo-location")) as any;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw permissionError();

  const startedAt = Date.now();
  const state: MutableSessionState = { settled: false, best: null };

  return new Promise((resolve, reject) => {
    let subscription: { remove: () => void } | null = null;
    let hardTimer: ReturnType<typeof setTimeout> | null = null;
    let tickTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      subscription?.remove();
      if (hardTimer) clearTimeout(hardTimer);
      if (tickTimer) clearInterval(tickTimer);
      options.signal?.removeEventListener("abort", handleAbort);
      subscription = null;
      hardTimer = null;
      tickTimer = null;
    };

    const settle = (result: CheckinLocationResult) => {
      if (state.settled) return;
      state.settled = true;
      cleanup();
      resolve(result);
    };

    const fail = (error: Error) => {
      if (state.settled) return;
      state.settled = true;
      cleanup();
      reject(error);
    };

    const settleWithAnchorFallback = (): boolean => {
      const fallback = anchorFallbackFix(options.preciseAnchors);
      if (!fallback) return false;
      settle({ kind: "review", fix: fallback });
      return true;
    };

    const evaluate = (hardCut = false) => {
      if (!state.best) {
        if (hardCut && !settleWithAnchorFallback()) fail(timeoutError());
        return;
      }
      const elapsed = Date.now() - startedAt;
      const result = evaluateCheckinFix(state.best, elapsed, "mobile", hardCut);
      if (result) settle(result);
      else if (hardCut && !settleWithAnchorFallback()) fail(timeoutError());
    };

    const consider = (fix: CheckinFix) => {
      const refined = applyAnchors(fix, options.preciseAnchors);
      if (!isBetterFix(refined, state.best)) return;
      state.best = refined;
      options.onProgress?.(refined);
      evaluate(false);
    };

    const handleAbort = () => fail(abortError());

    if (options.signal?.aborted) {
      fail(abortError());
      return;
    }
    options.signal?.addEventListener("abort", handleAbort);

    if (
      options.prewarmedFix &&
      Date.now() - options.prewarmedFix.observedAt >= 0 &&
      Date.now() - options.prewarmedFix.observedAt < PREWARM_MAX_AGE_MS
    ) {
      consider(options.prewarmedFix);
      if (state.settled) return;
    }

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy?.High ?? 5,
        timeInterval: 500,
        distanceInterval: 0,
      },
      (pos: { coords: { latitude: number; longitude: number; accuracy?: number | null } }) => {
        consider(toCheckinFixFromNative(pos));
      },
    )
      .then((sub: { remove: () => void }) => {
        if (state.settled) sub.remove();
        else subscription = sub;
      })
      .catch((error: unknown) => fail(error instanceof Error ? error : timeoutError()));

    tickTimer = setInterval(() => evaluate(false), EVALUATION_TICK_MS);
    hardTimer = setTimeout(() => evaluate(true), MOBILE_HARD_CUT_MS);
  });
}

export async function acquireCheckinLocation(options: {
  preciseAnchors: PreciseLocationAnchor[];
  prewarmedFix?: CheckinFix | null;
  onProgress?: (best: CheckinFix) => void;
  signal?: AbortSignal;
}): Promise<CheckinLocationResult> {
  if (Platform.OS === "web") return acquireWebCheckinLocation(options);
  return acquireNativeCheckinLocation(options);
}

export async function canStartWebCheckinWarmup(): Promise<boolean> {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  const permissions = navigator.permissions;
  if (!permissions?.query) return false;
  try {
    const status = await permissions.query({ name: "geolocation" as PermissionName });
    return status.state === "granted";
  } catch {
    return false;
  }
}

export function startWebCheckinWarmup(options: {
  preciseAnchors: PreciseLocationAnchor[];
  onProgress: (best: CheckinFix) => void;
}): CheckinWarmupSession | null {
  const state: MutableSessionState = { settled: false, best: null };
  return startWebSampling({
    maxDurationMs: WARMUP_MAX_DURATION_MS,
    onSample: (fix) => {
      const refined = applyAnchors(fix, options.preciseAnchors);
      if (!isBetterFix(refined, state.best)) return;
      state.best = refined;
      options.onProgress(refined);
    },
  });
}

export function formatCheckinAccuracy(accuracy?: number | null): string | null {
  if (accuracy == null || !Number.isFinite(accuracy)) return null;
  return `±${Math.round(accuracy)}m`;
}
