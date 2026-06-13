/**
 * Vitest セットアップ: Expo/React Native 由来のグローバルを定義
 * CI や Node 環境で __DEV__ が未定義だと expo-modules-core 等が落ちるため
 */
const g = globalThis as typeof globalThis & { __DEV__?: boolean };
if (typeof g.__DEV__ === "undefined") {
  g.__DEV__ = process.env.NODE_ENV !== "production";
}
