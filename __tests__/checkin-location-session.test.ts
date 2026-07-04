import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRuntime = vi.hoisted(() => ({
  platformOS: "web",
  desktopWeb: false,
  refineDesktopCheckinLocation: vi.fn(
    (pos: { lat: number; lng: number; accuracy?: number }) => pos,
  ),
}));

vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mockRuntime.platformOS;
    },
  },
}));

vi.mock("@/lib/get-current-location", () => ({
  isDesktopWeb: () => mockRuntime.desktopWeb,
  refineDesktopCheckinLocation: mockRuntime.refineDesktopCheckinLocation,
}));

import {
  acquireCheckinLocation,
  anchorFallbackFix,
  evaluateCheckinFix,
  type CheckinFix,
} from "@/lib/checkin-location-session";

type GeoSuccess = (position: GeolocationPosition) => void;
type GeoError = (error: GeolocationPositionError) => void;

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

function makePosition(lat: number, lng: number, accuracy: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

function installWebGeolocation() {
  let watchSuccess: GeoSuccess | null = null;

  const getCurrentPosition = vi.fn(
    (_success: GeoSuccess, _error?: GeoError | null, _options?: PositionOptions) => {},
  );
  const watchPosition = vi.fn(
    (success: GeoSuccess, _error?: GeoError | null, _options?: PositionOptions) => {
      watchSuccess = success;
      return 7;
    },
  );
  const clearWatch = vi.fn();

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      geolocation: {
        getCurrentPosition,
        watchPosition,
        clearWatch,
      },
    },
  });

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
    emit(lat: number, lng: number, accuracy: number) {
      if (!watchSuccess) throw new Error("watchPosition was not started");
      watchSuccess(makePosition(lat, lng, accuracy));
    },
  };
}

function fix(accuracy: number): CheckinFix {
  return { lat: 35, lng: 139, accuracy, observedAt: Date.now() };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-04T00:00:00.000Z"));
  mockRuntime.platformOS = "web";
  mockRuntime.desktopWeb = false;
  mockRuntime.refineDesktopCheckinLocation.mockImplementation(
    (pos: { lat: number; lng: number; accuracy?: number }) => pos,
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  } else {
    delete (globalThis as { navigator?: unknown }).navigator;
  }
});

describe("evaluateCheckinFix", () => {
  it("mobile acceptance ladder follows the Phase 1 thresholds", () => {
    expect(evaluateCheckinFix(fix(25), 0, "mobile")?.kind).toBe("accepted");
    expect(evaluateCheckinFix(fix(80), 3_000, "mobile")?.kind).toBe("accepted");
    expect(evaluateCheckinFix(fix(150), 6_000, "mobile")?.kind).toBe("accepted");
    expect(evaluateCheckinFix(fix(100), 10_000, "mobile", true)?.kind).toBe("accepted");
    expect(evaluateCheckinFix(fix(151), 10_000, "mobile", true)?.kind).toBe("review");
    expect(evaluateCheckinFix(fix(10_001), 10_000, "mobile", true)).toBeNull();
  });

  it("desktop web accepts only precise fixes immediately and otherwise requires review", () => {
    expect(evaluateCheckinFix(fix(35), 0, "desktop-web")?.kind).toBe("accepted");
    expect(evaluateCheckinFix(fix(36), 7_999, "desktop-web")).toBeNull();
    expect(evaluateCheckinFix(fix(50_000), 8_000, "desktop-web", true)?.kind).toBe("review");
  });
});

describe("acquireCheckinLocation on web", () => {
  it("uses a fresh prewarmed precise fix without starting a new watch", async () => {
    const geo = installWebGeolocation();
    const promise = acquireCheckinLocation({
      preciseAnchors: [],
      prewarmedFix: fix(18),
    });

    await expect(promise).resolves.toMatchObject({
      kind: "accepted",
      fix: { accuracy: 18 },
    });
    expect(geo.watchPosition).not.toHaveBeenCalled();
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });

  it("clears the web watch when an immediate precise sample is accepted", async () => {
    const geo = installWebGeolocation();
    const promise = acquireCheckinLocation({ preciseAnchors: [] });

    geo.emit(35.681236, 139.767125, 20);

    await expect(promise).resolves.toMatchObject({
      kind: "accepted",
      fix: { lat: 35.681236, lng: 139.767125, accuracy: 20 },
    });
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });

  it("waits up to the 3 second mobile threshold for an acceptable web sample", async () => {
    const geo = installWebGeolocation();
    const promise = acquireCheckinLocation({ preciseAnchors: [] });

    geo.emit(35.681236, 139.767125, 70);

    await vi.advanceTimersByTimeAsync(2_999);
    await expect(Promise.race([promise, Promise.resolve("pending")])).resolves.toBe("pending");

    await vi.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toMatchObject({
      kind: "accepted",
      fix: { accuracy: 70 },
    });
  });

  it("returns review at the desktop hard cut even when browser accuracy is very coarse", async () => {
    mockRuntime.desktopWeb = true;
    const geo = installWebGeolocation();
    const promise = acquireCheckinLocation({ preciseAnchors: [] });

    geo.emit(35.681236, 139.767125, 50_000);
    await vi.advanceTimersByTimeAsync(8_000);

    await expect(promise).resolves.toMatchObject({
      kind: "review",
      fix: { accuracy: 50_000 },
    });
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });

  it("applies desktop precise anchors before evaluating a sample", async () => {
    mockRuntime.desktopWeb = true;
    mockRuntime.refineDesktopCheckinLocation.mockReturnValue({
      lat: 35.681,
      lng: 139.767,
      accuracy: 20,
    });
    const geo = installWebGeolocation();
    const promise = acquireCheckinLocation({
      preciseAnchors: [{ lat: 35.681, lng: 139.767, accuracyM: 8, recordedAt: new Date() }],
    });

    geo.emit(35.7, 139.78, 600);

    await expect(promise).resolves.toMatchObject({
      kind: "accepted",
      fix: { lat: 35.681, lng: 139.767, accuracy: 20 },
    });
  });

  it("aborts and clears the web watch without leaving timers running", async () => {
    const geo = installWebGeolocation();
    const controller = new AbortController();
    const promise = acquireCheckinLocation({
      preciseAnchors: [],
      signal: controller.signal,
    });

    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    controller.abort();

    await expect(promise).rejects.toThrow("中断");
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });
});

describe("anchorFallbackFix — 測位ゼロ時の直近足あとフォールバック", () => {
  it("有効な直近アンカーからレビュー用の仮位置を返す（精度優先→新しさ優先）", () => {
    const now = Date.now();
    const result = anchorFallbackFix([
      { lat: 36.1, lng: 138.1, accuracyM: 40, recordedAt: new Date(now - 60_000) },
      { lat: 36.2, lng: 138.2, accuracyM: 12, recordedAt: new Date(now - 120_000) },
    ]);
    expect(result).toMatchObject({ lat: 36.2, lng: 138.2, accuracy: 12 });
  });

  it("24時間より古いアンカー・accuracy不明のアンカーは使わない", () => {
    const now = Date.now();
    expect(
      anchorFallbackFix([
        { lat: 36, lng: 138, accuracyM: 10, recordedAt: new Date(now - 25 * 60 * 60 * 1000) },
        { lat: 36, lng: 138, accuracyM: null, recordedAt: new Date(now - 1000) },
      ]),
    ).toBeNull();
  });
});

describe("acquireCheckinLocation — 測位ゼロでもエラー行き止まりにしない", () => {
  it("ハードカットまで1件も測位が来なくても、アンカーがあれば review で解決する", async () => {
    installWebGeolocation();
    const promise = acquireCheckinLocation({
      preciseAnchors: [
        { lat: 36.09, lng: 138.02, accuracyM: 15, recordedAt: new Date(Date.now() - 60_000) },
      ],
    });

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toMatchObject({
      kind: "review",
      fix: { lat: 36.09, lng: 138.02, accuracy: 15 },
    });
  });

  it("desktop-web で POSITION_UNAVAILABLE が来たら、ハードカットを待たずアンカーで review へ", async () => {
    mockRuntime.desktopWeb = true;
    let errorCb: GeoError | null = null;
    const getCurrentPosition = vi.fn(
      (_s: GeoSuccess, error?: GeoError | null) => {
        if (error) errorCb = error;
      },
    );
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition,
          watchPosition: vi.fn(() => 9),
          clearWatch: vi.fn(),
        },
      },
    });

    const promise = acquireCheckinLocation({
      preciseAnchors: [
        { lat: 36.09, lng: 138.02, accuracyM: 20, recordedAt: new Date(Date.now() - 30_000) },
      ],
    });

    errorCb!({ code: 2, message: "unavailable" } as GeolocationPositionError);

    await expect(promise).resolves.toMatchObject({
      kind: "review",
      fix: { lat: 36.09, lng: 138.02, accuracy: 20 },
    });
  });

  it("アンカーも無く測位も来ない場合のみタイムアウトエラーになる", async () => {
    installWebGeolocation();
    const promise = acquireCheckinLocation({ preciseAnchors: [] });
    const expectation = expect(promise).rejects.toThrow(/位置情報を取得できませんでした/);
    await vi.advanceTimersByTimeAsync(10_000);
    await expectation;
  });
});
