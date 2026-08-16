/**
 * 「いまの様子」バー（components/molecules/place-context-bar.tsx）の出し分け回帰テスト。
 *
 * 背景: 天気とライブカメラは実装済みだったが、地図のピンを押して開くシートの中にしか
 * 無く「さわらないと気づかれない」状態だった（2026-08-16 指摘）。足あと一覧の先頭に
 * 常時出すようにしたので、**どの県で何が出るか**を固定して守る。
 *
 * ここで守りたい失敗:
 *   1. 非対応県で国交省リンクを出してしまう（押しても無反応 = 最悪の体験）
 *   2. どの県でも1つも導線が出ない（バーが空 = 出した意味がない）
 */
import { describe, it, expect } from "vitest";
import {
  liveCameraLinkFor,
  youtubeLiveSearchUrl,
} from "@/lib/live-camera/live-camera-links";

/** 実装が「何も出さない」判断をする条件（place-context-bar.tsx と同じ式）。 */
function barIsEmpty(
  prefecture: string | null,
  municipality: string | null,
  weatherLine: string | null,
): boolean {
  const cam = liveCameraLinkFor(prefecture);
  const yt = youtubeLiveSearchUrl(municipality ?? prefecture ?? null);
  return !weatherLine && !cam && !yt;
}

describe("いまの様子バーの出し分け", () => {
  it("対応county(中部)では国交省リンクが出る", () => {
    const link = liveCameraLinkFor("長野県");
    expect(link).not.toBeNull();
    expect(link?.url.startsWith("https://")).toBe(true);
  });

  it("非対応県では国交省リンクを出さない（押しても無反応を作らない）", () => {
    // 北海道・東北・中国は http のみ / 到達不能で意図的に載せていない
    expect(liveCameraLinkFor("北海道")).toBeNull();
    expect(liveCameraLinkFor("青森県")).toBeNull();
  });

  it("国交省が非対応の県でも YouTube 導線は必ず出る（穴を作らない）", () => {
    for (const pref of ["北海道", "青森県", "島根県"]) {
      expect(liveCameraLinkFor(pref)).toBeNull();
      expect(youtubeLiveSearchUrl(pref)).not.toBeNull();
    }
  });

  it("国交省リンクは全て https（許可リストを通せる形）", () => {
    for (const pref of ["長野県", "東京都", "大阪府", "新潟県", "愛知県"]) {
      const l = liveCameraLinkFor(pref);
      if (l) expect(l.url.startsWith("https://")).toBe(true);
    }
  });

  it("県が分かればバーは空にならない（天気が取れなくても導線は残る）", () => {
    expect(barIsEmpty("長野県", "岡谷市", null)).toBe(false);
    expect(barIsEmpty("北海道", "札幌市", null)).toBe(false);
  });

  it("場所が全く無いときだけ何も出さない", () => {
    expect(barIsEmpty(null, null, null)).toBe(true);
  });

  it("足あとが無くてもフォールバック県があればバーは出る（機能ごと消さない）", () => {
    // ★2026-08-16: 「データが無いと機能が存在しない」のは無いのと同じ、という指摘。
    // 自分の足あとが0件でも「いま人がいる県」で天気とライブカメラを出す。
    const shown = (mine: string | null, fallback: string | null) => mine ?? fallback;
    for (const fb of ["長野県", "北海道", "東京都"]) {
      const pref = shown(null, fb);
      expect(barIsEmpty(pref, null, null)).toBe(false);
      // 国交省が非対応の県でも YouTube 導線は残るので空にならない
      expect(youtubeLiveSearchUrl(pref)).not.toBeNull();
    }
  });

  it("自分の足あとがあるときはフォールバックを使わない", () => {
    const shown = (mine: string | null, fallback: string | null) => mine ?? fallback;
    expect(shown("長野県", "北海道")).toBe("長野県");
  });

  it("市区町村があれば YouTube 検索は市区町村名で引く（県より具体的）", () => {
    const url = youtubeLiveSearchUrl("岡谷市");
    expect(url).toContain(encodeURIComponent("岡谷市"));
  });
});
