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
