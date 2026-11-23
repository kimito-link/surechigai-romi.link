/**
 * アプリDL導線（AppDownloadCta）の「端末で出し分け」と「置き場所」を守る。
 *
 * 守る事故:
 * 1. iPhone で見ている人に Google Play を出す（以前は並べ替えだけで、別 OS のストアも出ていた）
 * 2. まだ配信前のストア（例: iPhone 版）を、その端末の人に代わりに別ストアで見せる
 * 3. トップ（ゲスト用ホーム）から導線が消える（web-ios-android 15_APP_LINK_FROM_WEB）
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: <T,>(s: T) => s },
  View: () => null,
  Text: () => null,
}));

const { storeLinksForViewer } = await import("@/components/molecules/app-download-cta");

const IOS = { kind: "ios" as const, label: "App Store", url: "https://apps.apple.com/jp/app/id1" };
const PLAY = { kind: "android" as const, label: "Google Play", url: "https://play.google.com/store/apps/details?id=x" };

describe("storeLinksForViewer（端末で出し分け）", () => {
  it("PC など端末が分からなければ配信中の全部", () => {
    expect(storeLinksForViewer([IOS, PLAY], null)).toEqual([IOS, PLAY]);
  });

  it("iPhone は App Store だけ、Android は Google Play だけ", () => {
    expect(storeLinksForViewer([IOS, PLAY], "ios")).toEqual([IOS]);
    expect(storeLinksForViewer([IOS, PLAY], "android")).toEqual([PLAY]);
  });

  it("その端末のストアが配信前なら何も出さない（別 OS のストアで代わりにしない）", () => {
    expect(storeLinksForViewer([PLAY], "ios")).toEqual([]);
  });
});

describe("置き場所", () => {
  const ROOT = resolve(__dirname, "..");
  const GUEST = readFileSync(resolve(ROOT, "components/post/post-guest-screen.tsx"), "utf8");
  const CTA = readFileSync(resolve(ROOT, "components/molecules/app-download-cta.tsx"), "utf8");

  it("トップ（ゲスト用ホーム）に、冒頭と下部の2か所で置かれている", () => {
    expect(GUEST).toMatch(/import \{ AppDownloadCta \} from "@\/components\/molecules\/app-download-cta"/);
    expect(GUEST.match(/\{appDownloadNode\}/g)?.length ?? 0).toBeGreaterThanOrEqual(3); // 冒頭(PC/スマホ)＋下部
  });

  it("アプリの中（Capacitor 殻を含む）では出さない判定を使っている", () => {
    expect(CTA).toMatch(/isNativeAppShell\(\)/);
  });

  it("公式バッジ画像を使う（自作ボタンにしない）", () => {
    expect(CTA).toContain("/store-badges/apple-appstore-ja.svg");
    expect(CTA).toContain("/store-badges/google-play-ja.png");
    for (const f of ["apple-appstore-ja.svg", "google-play-ja.png"]) {
      expect(() => readFileSync(resolve(ROOT, "public/store-badges", f))).not.toThrow();
    }
  });
});
