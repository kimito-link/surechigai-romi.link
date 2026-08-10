/**
 * ネイティブアプリの中では、アプリDL導線を出さない。
 *
 * アプリを入れている人に「アプリをダウンロード」を見せるのは
 * 意味がないうえ、App Store の審査で「他のストアへ誘導している」と
 * 受け取られる余地を作らないためでもある。
 *
 * Platform.OS === "ios" = Expo prebuild でネイティブ実機に載っている状態。
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

const { isInsideNativeApp, guessViewerPlatform } = await import("@/lib/store-links");

describe("ネイティブアプリの中で見ているとき", () => {
  it("アプリ内と判定する（＝DL導線を出さない）", () => {
    expect(isInsideNativeApp()).toBe(true);
  });

  it("閲覧環境は UA ではなく Platform.OS から確定させる", () => {
    // ネイティブでは UA 推定に頼らない。Platform.OS が確実な情報源
    expect(guessViewerPlatform()).toBe("ios");
  });
});
