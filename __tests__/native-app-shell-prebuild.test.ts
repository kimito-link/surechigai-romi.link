/**
 * Expo prebuild 構成（Platform.OS === "ios"）でのネイティブ判定を固定する。
 *
 * 背景（2026-08-06）:
 * ビルド方式を Capacitor（server.url でリモートWebを WebView で読む）から
 * Expo prebuild（バンドルJSを実行）へ切り替えている。この2つでは
 * 「ネイティブである」ことの現れ方が違う。
 *
 *   - Capacitor : ネイティブでも Platform.OS === "web"。window.Capacitor を見るしかない
 *   - prebuild  : Platform.OS === "ios" | "android"。window.Capacitor は存在しない
 *
 * **prebuild 後に Capacitor 判定だけを残すと isNativeAppShell() が常に false になり、
 * 2026-08-05 に直した却下2件（4.8 の自動クリック / 2.3.7 の価格表現）が再発する。**
 * この危険を回避できているかを、Platform.OS をモックして確認する。
 *
 * Platform はモジュールスコープで評価されるため、Capacitor 経路のテスト
 * （__tests__/native-app-shell.test.ts）とはファイルを分けている
 * （同一ファイル内で Platform.OS を切り替えられない）。
 */
import { describe, expect, it, vi } from "vitest";

// Platform.OS === "ios" = Expo prebuild でネイティブ実機に載っている状態。
// window.Capacitor は意図的に用意しない（prebuild には存在しないため）。
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

const { isNativeAppShell, loginCtaNote } = await import("@/lib/native-app-shell");

describe("Expo prebuild 構成でのネイティブ判定", () => {
  it("Platform.OS === 'ios' ならネイティブ扱い（window.Capacitor が無くても）", () => {
    expect(isNativeAppShell()).toBe(true);
  });

  it("window を渡さなくてもネイティブと判定できる（Capacitor ブリッジに依存しない）", () => {
    expect(isNativeAppShell(undefined)).toBe(true);
  });

  it("Guideline 2.3.7: 価格表現を出さない（prebuild 後も維持されること）", () => {
    const note = loginCtaNote();
    expect(note).not.toContain("無料");
    expect(note).toContain("1タップ");
  });
});
