/**
 * 居場所 ON/OFF のローカル意思（サーバー応答を待たず即 watch 開始するため）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const LIVE_PRESENCE_USER_OFF_KEY = "@surechigai_live_presence_user_off_v1";

type Listener = () => void;
let optimisticDesired = false;
const listeners = new Set<Listener>();

function notify() {
  for (const fn of [...listeners]) {
    fn();
  }
}

export function setOptimisticLivePresenceDesired(value: boolean): void {
  optimisticDesired = value;
  notify();
}

export function readOptimisticLivePresenceDesired(): boolean {
  return optimisticDesired;
}

export function subscribeOptimisticLivePresenceDesired(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function readLivePresenceUserOffSync(): boolean {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(LIVE_PRESENCE_USER_OFF_KEY) === "1";
    } catch {
      return false;
    }
  }
  return false;
}

export async function saveLivePresenceUserOff(off: boolean): Promise<void> {
  if (off) {
    await AsyncStorage.setItem(LIVE_PRESENCE_USER_OFF_KEY, "1");
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(LIVE_PRESENCE_USER_OFF_KEY, "1");
    }
    setOptimisticLivePresenceDesired(false);
    return;
  }
  await AsyncStorage.removeItem(LIVE_PRESENCE_USER_OFF_KEY);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.removeItem(LIVE_PRESENCE_USER_OFF_KEY);
  }
}
