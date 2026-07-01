/**
 * Web 向けリアルタイム位置セッション（fujisan-clean の requestLocation パターン）。
 * 速いキャッシュ → watchPosition → 500ms 後に高精度 1 発。
 */
import { Platform } from "react-native";
import type { CurrentLocation } from "@/lib/get-current-location";

const GEO_FAST: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 300_000,
  timeout: 10_000,
};

const GEO_ACCURATE: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 25_000,
};

const VISIBILITY_REFRESH_DEBOUNCE_MS = 2_500;

function toLocation(pos: GeolocationPosition): CurrentLocation {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

export type LiveLocationSession = {
  stop: () => void;
  refreshNow: () => void;
};

/** Web のみ。Native は expo-location の watch を use-live-presence 側で使う。 */
export function startWebLiveLocationSession(
  onLocation: (loc: CurrentLocation) => void,
): LiveLocationSession | null {
  if (Platform.OS !== "web" || typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  let watchId: number | null = null;
  let accurateTimer: ReturnType<typeof setTimeout> | null = null;
  let lastVisibilityRefresh = 0;

  const push = (pos: GeolocationPosition) => {
    onLocation(toLocation(pos));
  };

  const refreshNow = () => {
    navigator.geolocation.getCurrentPosition(push, () => {}, GEO_ACCURATE);
  };

  navigator.geolocation.getCurrentPosition(push, () => {}, GEO_FAST);

  watchId = navigator.geolocation.watchPosition(push, () => {}, GEO_ACCURATE);

  accurateTimer = setTimeout(refreshNow, 500);

  const onVisibility = () => {
    if (typeof document === "undefined" || document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastVisibilityRefresh < VISIBILITY_REFRESH_DEBOUNCE_MS) return;
    lastVisibilityRefresh = now;
    refreshNow();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  const stop = () => {
    if (accurateTimer) clearTimeout(accurateTimer);
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibility);
    }
    watchId = null;
    accurateTimer = null;
  };

  return { stop, refreshNow };
}
