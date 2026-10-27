/**
 * 起動時と前面に戻ったときに、更新 / 新しい内容の通知を確かめる。
 * 描画はしない。expo-notifications はネイティブのときだけ読み込む。
 */
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

export function UpdateNotificationHost() {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      if (Platform.OS === "web") {
        void import("@/lib/notifications/web-update-notice").then((mod) => mod.checkWebUpdateNotice());
        return;
      }
      void import("@/lib/notifications/native-update-notice").then((mod) => mod.checkNativeUpdateNotice());
    };

    run();
    if (Platform.OS === "web") return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return null;
}
