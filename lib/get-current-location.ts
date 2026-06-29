/**
 * 現在地取得（Web: Geolocation API / Native: expo-location）。
 */

import { Platform } from "react-native";

export type CurrentLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

function getWebLocation(): Promise<CurrentLocation> {
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
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

async function getNativeLocation(): Promise<CurrentLocation> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Location = (await import("expo-location")) as any;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("位置情報の許可が必要です");
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy?.Balanced ?? 4,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

export async function getCurrentLocation(): Promise<CurrentLocation> {
  if (Platform.OS === "web") return getWebLocation();
  return getNativeLocation();
}
