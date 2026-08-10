/**
 * 共有リンク着地ページの「アプリDL導線」が出る/出ない条件を守る。
 *
 * このテストが守る事故:
 * 1. 未配信ストアのリンクを出してしまう（押すと 404 = 無いより悪い）
 * 2. ストアURLを画面にハードコードして、採番後に差し替え漏れする
 * 3. 外部リンクのホワイトリスト漏れで、押しても無言で何も起きない
 *    （openExternalUrl は許可外ドメインを黙って false で返す）
 *
 * Platform.OS === "web" = ブラウザで共有リンクを見ている状態。
 * ここが最大の獲得経路なので、導線は必ず出ていなければならない。
 */
import { describe, expect, it, vi } from "vitest";
import appConfig from "@/app.config.json";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

const { availableStoreLinks, iosStoreUrl, androidStoreUrl, isInsideNativeApp } =
  await import("@/lib/store-links");

describe("web で共有リンクを見ているとき", () => {
  it("アプリ内ではないと判定する（＝DL導線を出してよい）", () => {
    expect(isInsideNativeApp()).toBe(false);
  });

  it("App Store のリンクを出す（ascAppId は審査前から確定している）", () => {
    const url = iosStoreUrl();
    expect(url).toBeTruthy();
    expect(url).toContain("apps.apple.com");
    // URL は app.config.json の値から組む。ハードコードを禁じる
    expect(url).toContain(appConfig.stores.ascAppId);
  });

  it("配信中のストアが1つ以上ある", () => {
    expect(availableStoreLinks().length).toBeGreaterThan(0);
  });

  it("Play 未登録の間は Google Play を出さない（押すと404になるため）", () => {
    const registered = (appConfig.stores.playAppId || "").trim();
    if (registered) {
      expect(androidStoreUrl()).toContain("play.google.com");
    } else {
      expect(androidStoreUrl()).toBeNull();
      expect(availableStoreLinks().some((l) => l.kind === "android")).toBe(false);
    }
  });

  it("返すURLはすべて https（openExternalUrl が http を弾くため）", () => {
    for (const link of availableStoreLinks()) {
      expect(link.url.startsWith("https://")).toBe(true);
    }
  });
});

describe("外部リンクのホワイトリスト", () => {
  // openExternalUrl は許可外ドメインを黙って false で返すので、
  // ここが漏れると「ボタンを押しても何も起きない」という
  // 最も気づきにくい壊れ方をする。
  //
  // 注意: ソースを文字列 grep するだけの検査にしてはいけない。
  // コメントアウトされた行にもドメイン文字列は残るため、
  // 許可リストから実際に外れても緑のままになる（実際に一度そうなった）。
  // 必ず openExternalUrl の実挙動で判定する。
  it("ストアのURLを openExternalUrl が実際に開ける", async () => {
    const opened: string[] = [];
    vi.stubGlobal("window", {
      open: (url: string) => {
        opened.push(url);
        return null;
      },
    });

    const { openExternalUrl } = await import("@/lib/navigation/external-links");

    for (const link of availableStoreLinks()) {
      const ok = await openExternalUrl(link.url);
      // false = ホワイトリスト漏れ。ボタンを押しても無反応になる
      expect(ok, `${link.label} (${link.url}) が許可されていない`).toBe(true);
    }
    expect(opened.length).toBe(availableStoreLinks().length);

    vi.unstubAllGlobals();
  });

  it("許可外ドメインは開けない（検査自体が機能していることの確認）", async () => {
    vi.stubGlobal("window", { open: () => null });
    const { openExternalUrl } = await import("@/lib/navigation/external-links");
    expect(await openExternalUrl("https://example.invalid/app")).toBe(false);
    vi.unstubAllGlobals();
  });
});
