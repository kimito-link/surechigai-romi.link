/**
 * 位置情報の明示同意（再訪問時の自動開始用）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const LOCATION_OPT_IN_KEY = "@surechigai_location_opt_in_v1";

export function readLocationOptInSync(): boolean {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(LOCATION_OPT_IN_KEY) === "1";
    } catch {
      return false;
    }
  }
  return false;
}

export async function readLocationOptIn(): Promise<boolean> {
  const sync = readLocationOptInSync();
  if (sync) return true;
  try {
    return (await AsyncStorage.getItem(LOCATION_OPT_IN_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function saveLocationOptIn(): Promise<void> {
  await AsyncStorage.setItem(LOCATION_OPT_IN_KEY, "1");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(LOCATION_OPT_IN_KEY, "1");
  }
}

export async function clearLocationOptIn(): Promise<void> {
  await AsyncStorage.removeItem(LOCATION_OPT_IN_KEY);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.removeItem(LOCATION_OPT_IN_KEY);
  }
}
