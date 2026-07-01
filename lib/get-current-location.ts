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

function getWebLocation(options?: GetLocationOptions): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("この端末では位置情報を取得できません"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => reject(new Error("位置情報の許可が必要です")),
      options?.highAccuracy ? WEB_HIGH_ACCURACY : WEB_BALANCED,
    );
  });
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

/** チェックイン用: 高精度優先。精度が粗い場合は1回だけ再取得を試みる。 */
export async function getCheckinLocation(): Promise<CurrentLocation> {
  const first = await getCurrentLocation({ highAccuracy: true });

  if (first.accuracy && first.accuracy > 80) {
    try {
      const retry = await getCurrentLocation({ highAccuracy: true });
      if (!retry.accuracy || (first.accuracy && retry.accuracy < first.accuracy)) {
        return retry;
      }
    } catch {
      // 再取得失敗時は初回結果を使う
    }
  }

  return first;
}
