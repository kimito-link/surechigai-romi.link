/**
 * Vitest セットアップ: Expo/React Native 由来のグローバルを定義
 * CI や Node 環境で __DEV__ が未定義だと expo-modules-core 等が落ちるため
 */
import Module from "node:module";

const g = globalThis as typeof globalThis & { __DEV__?: boolean };
if (typeof g.__DEV__ === "undefined") {
  g.__DEV__ = process.env.NODE_ENV !== "production";
}

/**
 * Metro 流儀の `require("@/assets/...png")`（画像アセット）を vitest でも読めるようにする。
 * vite の alias / vi.mock は ESM import にしか効かず、素の require は Node の解決に落ちて
 * 「Cannot find module '@/assets/...'」になる（2026-10-05、sign-in-auth-handoff-overlay の描画テストで発覚）。
 * 画像の中身はテストに不要なので、画像拡張子だけ数値 1（Metro のアセット ID と同じ型）を返す。
 * それ以外の require には触らない。
 */
const IMAGE_ASSET_RE = /\.(png|jpe?g|gif|webp|svg)$/i;
const originalRequire = Module.prototype.require;
Module.prototype.require = function patchedRequire(this: unknown, id: string) {
  if (IMAGE_ASSET_RE.test(id)) return 1;
  return originalRequire.call(this, id);
} as typeof Module.prototype.require;
