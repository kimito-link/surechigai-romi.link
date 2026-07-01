/**
 * 現在地取得（Web: Geolocation API / Native: expo-location）。
 */

import { Platform } from "react-native";

export type CurrentLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type GetLocationOptions = {
  /** チェックイン向け: GPS優先・キャッシュ無効 */
  highAccuracy?: boolean;
};

/** スマホ等で記録済みの高精度足あと（PCブラウザの粗い測位を補正） */
export type PreciseLocationAnchor = {
  lat: number;
  lng: number;
  accuracyM: number | null;
  recordedAt: string | Date;
};

export type CheckinLocationOptions = {
  preciseAnchor?: PreciseLocationAnchor | null;
};

const WEB_BALANCED: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 60_000,
};

const WEB_HIGH_ACCURACY: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 25_000,
  maximumAge: 0,
};

const ANCHOR_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const ANCHOR_MAX_DISTANCE_M = 300;
const ANCHOR_MAX_ACCURACY_M = 50;
const PC_COARSE_ACCURACY_M = 50;

export function isDesktopWeb(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine) and (min-width: 768px)").matches;
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** PCの粗い測位を、直近のスマホ高精度足あとに寄せる（同一場所での端末差を縮める） */
export function refineWithPreciseAnchor(
  pos: CurrentLocation,
  anchor: PreciseLocationAnchor | null | undefined,
): CurrentLocation {
  if (!anchor) return pos;
  if (anchor.accuracyM == null || anchor.accuracyM > ANCHOR_MAX_ACCURACY_M) return pos;

  const posAccuracy = pos.accuracy ?? Number.POSITIVE_INFINITY;
  if (posAccuracy <= PC_COARSE_ACCURACY_M) return pos;

  const ageMs = Date.now() - new Date(anchor.recordedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > ANCHOR_MAX_AGE_MS) return pos;

  const distM = haversineMeters(pos, anchor);
  if (distM > ANCHOR_MAX_DISTANCE_M) return pos;

  return {
    lat: anchor.lat,
    lng: anchor.lng,
    accuracy: anchor.accuracyM ?? pos.accuracy,
  };
}

function toCurrentLocation(pos: GeolocationPosition): CurrentLocation {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

function getWebLocation(options?: GetLocationOptions): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("この端末では位置情報を取得できません"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toCurrentLocation(pos)),
      () => reject(new Error("位置情報の許可が必要です")),
      options?.highAccuracy ? WEB_HIGH_ACCURACY : WEB_BALANCED,
    );
  });
}

/**
 * Web チェックイン: watchPosition で複数サンプルを取り、最も精度の良い測位を採用。
 * PC ブラウザは Wi-Fi 測位の収束に時間がかかるため、desktop は待機を長めにする。
 */
function watchWebLocationBestSample(options: {
  maxWaitMs: number;
  targetAccuracyM: number;
  settleMs: number;
}): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("この端末では位置情報を取得できません"));
      return;
    }

    let best: CurrentLocation | null = null;
    let watchId: number | null = null;
    let settled = false;
    let lastImproveAt = Date.now();
    const startedAt = Date.now();

    const cleanup = () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(hardTimeout);
      clearInterval(settleTimer);
    };

    const finish = (loc: CurrentLocation) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(loc);
    };

    const consider = (sample: CurrentLocation) => {
      if (
        !best ||
        (sample.accuracy ?? Number.POSITIVE_INFINITY) <
          (best.accuracy ?? Number.POSITIVE_INFINITY)
      ) {
        best = sample;
        lastImproveAt = Date.now();
      }

      const acc = sample.accuracy ?? Number.POSITIVE_INFINITY;
      if (acc <= options.targetAccuracyM) {
        finish(best);
      }
    };

    const hardTimeout = setTimeout(() => {
      if (best) finish(best);
      else {
        settled = true;
        cleanup();
        reject(new Error("位置情報の取得がタイムアウトしました。ブラウザの位置情報を許可してください。"));
      }
    }, options.maxWaitMs);

    const settleTimer = setInterval(() => {
      if (!best) return;
      const acc = best.accuracy ?? Number.POSITIVE_INFINITY;
      const stalled = Date.now() - lastImproveAt >= options.settleMs;
      const elapsed = Date.now() - startedAt;

      if (stalled && acc <= 120) finish(best);
      if (elapsed >= options.maxWaitMs * 0.8 && acc <= 250) finish(best);
    }, 400);

    watchId = navigator.geolocation.watchPosition(
      (pos) => consider(toCurrentLocation(pos)),
      () => {
        if (best) {
          finish(best);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => finish(toCurrentLocation(pos)),
          () => reject(new Error("位置情報の許可が必要です")),
          WEB_HIGH_ACCURACY,
        );
      },
      WEB_HIGH_ACCURACY,
    );
  });
}

async function getNativeCheckinLocation(): Promise<CurrentLocation> {
  const first = await getNativeLocation({ highAccuracy: true });

  if (first.accuracy && first.accuracy > 80) {
    try {
      const retry = await getNativeLocation({ highAccuracy: true });
      if (!retry.accuracy || (first.accuracy && retry.accuracy < first.accuracy)) {
        return retry;
      }
    } catch {
      // 再取得失敗時は初回結果を使う
    }
  }

  return first;
}

async function getNativeLocation(options?: GetLocationOptions): Promise<CurrentLocation> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Location = (await import("expo-location")) as any;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("位置情報の許可が必要です");
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: options?.highAccuracy
      ? (Location.Accuracy?.BestForNavigation ?? Location.Accuracy?.High ?? 6)
      : (Location.Accuracy?.Balanced ?? 3),
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

export async function getCurrentLocation(options?: GetLocationOptions): Promise<CurrentLocation> {
  if (Platform.OS === "web") return getWebLocation(options);
  return getNativeLocation(options);
}

/** チェックイン用: Web は watch 測位、Native は高精度 GPS。必要なら直近の高精度足あとで補正。 */
export async function getCheckinLocation(options?: CheckinLocationOptions): Promise<CurrentLocation> {
  let pos: CurrentLocation;

  if (Platform.OS === "web") {
    const desktop = isDesktopWeb();
    pos = await watchWebLocationBestSample({
      maxWaitMs: desktop ? 32_000 : 20_000,
      targetAccuracyM: desktop ? 40 : 25,
      settleMs: desktop ? 3_000 : 2_000,
    });
  } else {
    pos = await getNativeCheckinLocation();
  }

  return refineWithPreciseAnchor(pos, options?.preciseAnchor);
}

/** チェックイン測位中の UI 文言 */
export function getCheckinLocatingLabel(): string {
  if (Platform.OS === "web" && isDesktopWeb()) {
    return "位置を精密測位中…（PCは最大30秒）";
  }
  return "位置を取得中…";
}
