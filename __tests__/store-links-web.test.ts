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
 * ここが最大の獲得経路だが、「必ず出す」ことが正しいわけではない。
 * 配信前に出すと 404 に着地させてしまい、最初の一撃を無駄にする。
 * 出す/出さないは app.config.json の stores（iosPublished / playAppId）が唯一の根拠。
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

  it("iOS 未公開の間は App Store を出さない（押すと404になるため）", () => {
    // ★ascAppId は審査を出す前から採番される。「IDがある＝公開済み」ではない。
    //   以前ここは「ascAppId があれば出す」を守るテストだったが、その仕様自体が
    //   未公開のまま押せるボタンを生んでいた（2026-08-14 修正）。
    const published = appConfig.stores.iosPublished === true;
    const url = iosStoreUrl();
    if (published) {
      expect(url).toContain("apps.apple.com");
      // URL は app.config.json の値から組む。ハードコードを禁じる
      expect(url).toContain(appConfig.stores.ascAppId);
    } else {
      expect(url).toBeNull();
      expect(availableStoreLinks().some((l) => l.kind === "ios")).toBe(false);
    }
  });

  it("どのストアも未公開なら導線は空（＝コンポーネントが何も描画しない）", () => {
    const iosLive = appConfig.stores.iosPublished === true;
    const playLive = Boolean((appConfig.stores.playAppId || "").trim());
    expect(availableStoreLinks().length).toBe(Number(iosLive) + Number(playLive));
  });

  // ★ここから下は「設定に追随するだけのテスト」にしないための実値ロック。
  //   上のテストは config を読んで期待値を作るので、iosPublished を誤って
  //   true にしても緑のまま通ってしまう（実際に反転させて緑を確認した）。
  //   「いま出荷してよい状態か」は事実として固定し、公開時に人が明示的に
  //   書き換える。書き換え忘れれば落ちるので、リリース手順の栞にもなる。
  it("【出荷ゲート】iOS は未公開なので App Store 導線を出してはいけない", () => {
    // 公開したらこの2行を true / 期待値ありに書き換える（同時に app.config.json も）
    expect(appConfig.stores.iosPublished).toBe(false);
    expect(iosStoreUrl()).toBeNull();
  });

  it("【出荷ゲート】Play も未公開なので導線は0件", () => {
    expect((appConfig.stores.playAppId || "").trim()).toBe("");
    expect(availableStoreLinks()).toHaveLength(0);
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
