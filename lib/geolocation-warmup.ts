/**
 * 星野ロミ型 — UI より先に Geolocation キャッシュを温める（§9-8 常駐タスクの Web 版）。
 */
import { Platform } from "react-native";

const GEO_FAST: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 300_000,
  timeout: 8_000,
};

export function warmGeolocationCache(): void {
  if (Platform.OS !== "web") return;
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {},
    GEO_FAST,
  );
}
