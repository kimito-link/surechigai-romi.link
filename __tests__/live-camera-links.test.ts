/**
 * 足あとの場所のライブカメラ導線を守る。
 *
 * 背景（2026-08-15 ユーザー要望「場所のライブカメラとかもある場所は入れてほしい」）:
 * 国交省が地方整備局ごとに道路ライブカメラの一覧ページを公開している。
 *
 * ★調査で確定した制約（推測ではなく実測・2026-08-15）:
 *   - 画像データそのもののAPIは**有償**（河川情報センター経由）。無料APIは無い
 *     → 画像を取り込むのではなく、公式ページへ**リンク**する方式にする
 *   - 埋め込みは規約上グレー（「各映像の視聴等は各管理団体へお問い合わせ下さい」）
 *     かつ CSP の frame-src 緩和が必要 → 埋め込みはしない
 *   - 東北(pdasv1.thr.mlit.go.jp)は到達不能(curl 000)だったので載せない
 *   - 北海道・中国は http のみ。openExternalUrl は https しか通さないので、
 *     **載せても押して無反応になる**。よって載せない（無言 false を作らない）
 *
 * ★「無い場所のほうが多い」前提の設計:
 *   カバーできない都道府県は導線自体を出さない（空リンクや無反応を作らない）。
 */
import { describe, expect, it, vi } from "vitest";

// external-links.ts は react-native を読むので、ここでも最小スタブが要る
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { canOpenURL: vi.fn(), openURL: vi.fn() },
}));

import {
  liveCameraLinkFor,
  LIVE_CAMERA_LINKS,
} from "@/lib/live-camera/live-camera-links";
import { prefectures } from "@/constants/prefectures";

describe("liveCameraLinkFor（ライブカメラ導線）", () => {
  it("対応している都道府県ではリンクを返す", () => {
    // 関東（実測で 200 を確認済みの地方整備局）
    const tokyo = liveCameraLinkFor("東京都");

    expect(tokyo).not.toBeNull();
    expect(tokyo!.url).toMatch(/^https:\/\//);
    expect(tokyo!.label.length).toBeGreaterThan(0);
  });

  it("未対応の都道府県では null（導線を出さない）", () => {
    // 北海道は http のみでホワイトリストを通らないため、意図的に非対応
    expect(liveCameraLinkFor("北海道")).toBeNull();
    // 東北は提供ページが到達不能だったため非対応
    expect(liveCameraLinkFor("宮城県")).toBeNull();
  });

  it("未知の入力では null", () => {
    expect(liveCameraLinkFor("存在しない県")).toBeNull();
    expect(liveCameraLinkFor(null)).toBeNull();
    expect(liveCameraLinkFor(undefined)).toBeNull();
    expect(liveCameraLinkFor("")).toBeNull();
  });

  it("登録されている都道府県名はすべて実在する（表記ゆれを防ぐ）", () => {
    const known = new Set<string>(prefectures);
    const unknown = Object.keys(LIVE_CAMERA_LINKS).filter((p) => !known.has(p));

    // constants/prefectures.ts と表記がずれると静かに導線が消える
    expect(unknown).toEqual([]);
  });

  it("登録されているURLはすべて https（http だと押しても無反応になる）", () => {
    const notHttps = Object.values(LIVE_CAMERA_LINKS)
      .map((v) => v.url)
      .filter((url) => !url.startsWith("https://"));

    expect(notHttps).toEqual([]);
  });

  it("すべて mlit.go.jp 配下（公式ページ以外へ誘導しない）", () => {
    const foreign = Object.values(LIVE_CAMERA_LINKS)
      .map((v) => new URL(v.url).hostname)
      .filter((host) => !host.endsWith("mlit.go.jp"));

    expect(foreign).toEqual([]);
  });
});

describe("youtubeLiveSearchUrl（地名でライブ配信を探す）", () => {
  it("地名からライブ検索URLを作る", async () => {
    const { youtubeLiveSearchUrl } = await import("@/lib/live-camera/live-camera-links");
    const url = youtubeLiveSearchUrl("茅野市");

    expect(url).not.toBeNull();
    expect(url!).toContain("youtube.com/results");
    // 地名がURLエンコードされて入っている
    expect(url!).toContain(encodeURIComponent("茅野市"));
  });

  it("ライブ配信に絞り込むフィルタが付く（通常動画に埋もれさせない）", async () => {
    const { youtubeLiveSearchUrl } = await import("@/lib/live-camera/live-camera-links");

    expect(youtubeLiveSearchUrl("那覇市")!).toContain("sp=");
  });

  it("地名が無ければ null（導線を出さない）", async () => {
    const { youtubeLiveSearchUrl } = await import("@/lib/live-camera/live-camera-links");

    expect(youtubeLiveSearchUrl(null)).toBeNull();
    expect(youtubeLiveSearchUrl(undefined)).toBeNull();
    expect(youtubeLiveSearchUrl("   ")).toBeNull();
  });

  it("国交省が未対応の県でも YouTube なら開ける（穴を埋める）", async () => {
    const { youtubeLiveSearchUrl } = await import("@/lib/live-camera/live-camera-links");

    // 北海道は国交省リンクを載せていない（http のみのため）
    expect(liveCameraLinkFor("北海道")).toBeNull();
    expect(youtubeLiveSearchUrl("札幌市")).not.toBeNull();
  });
});

describe("ホワイトリストとの整合", () => {
  it("登録URLのホストは外部リンク許可リストを通る（無言 false を作らない）", async () => {
    // openExternalUrl は許可外ドメインで無言 false を返す。
    // ライブカメラのドメインを許可リストに入れ忘れると、押しても何も起きない。
    const { getAllowedDomains } = await import("@/lib/navigation/external-links");
    const allowed = getAllowedDomains();

    for (const entry of Object.values(LIVE_CAMERA_LINKS)) {
      const host = new URL(entry.url).hostname;
      const ok = allowed.some(
        (d) => host === d || host === `www.${d}` || host.endsWith(`.${d}`),
      );
      expect(ok, `${host} が許可リストに無い`).toBe(true);
    }
  });
});
