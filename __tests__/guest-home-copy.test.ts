import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ALL_VISIBLE_COPY,
  APP_NAME,
  BENEFITS,
  CTA_LABEL,
  CTA_NOTE,
  HERO_ARIA_LABEL,
  HERO_LINES,
  HERO_SUB,
  RADAR_CAPTION,
} from "../apps/web/lib/guest-home-copy";

/**
 * トップ `/` に出る文言の契約。
 *
 * ★このテストが守っているもの（出典: CLAUDE.md ディレクティブ1.5 / DESIGN.md）:
 *   - 旧仮名「すれ違ひ」。旧版は同じ画面に新仮名「すれ違い」が混ざっていた
 *   - ヒーローは3段。アプリ名を出さない
 *   - 誇張語を書かない（scripts/diff-check.mjs は追加行しか見ないので、ここで恒久的に見張る）
 *   - 説明文を増やして画面を埋めない（Anti-Slop）
 */

/**
 * 誇張語の一覧は scripts/diff-check.config.json が正本。読み込んで使う。
 *
 * ★語をここに書き写さない理由: diff-check は追加行に誇張語があると止める。
 *   一覧をベタ書きすると、この「誇張語を見張るテスト」自体が引っかかって
 *   コミットできなくなる（検査対象に自分が含まれる検査の典型）。
 *   正本を読めば、語が増えたときに自動で追随もする。
 */
const FORBIDDEN_WORDS: readonly string[] = JSON.parse(
  readFileSync(
    new URL("../scripts/diff-check.config.json", import.meta.url),
    "utf8",
  ),
).forbiddenWords;

/** DESIGN.md の brandCopy.avoid。言うと本アプリの価値の逆になる。 */
const AVOID_PHRASES = [
  "近くの友達を探す",
  "匿名で安全にマッチング",
  "ぼかした位置だけを保存",
  "マッチングを開始",
  "友達を検索",
  "位置情報は保存されません",
] as const;

describe("ゲスト画面の文言", () => {
  it("★「すれ違い」（新仮名）を使わない。旧仮名「すれ違ひ」で揃える", () => {
    for (const text of ALL_VISIBLE_COPY) {
      expect(text, `「すれ違い」が混ざっている: ${text}`).not.toContain(
        "すれ違い",
      );
    }
    // 読み上げ用ラベルも対象（スクリーンリーダーで読まれる）。
    expect(HERO_ARIA_LABEL).not.toContain("すれ違い");
  });

  it("「すれ違ひ」を実際に使っている（統一が形骸化していないこと）", () => {
    const joined = ALL_VISIBLE_COPY.join("");
    expect(joined).toContain("すれ違ひ");
  });

  it("★誇張語を書かない", () => {
    for (const text of ALL_VISIBLE_COPY) {
      for (const word of FORBIDDEN_WORDS) {
        expect(text, `禁止語「${word}」が入っている: ${text}`).not.toContain(
          word,
        );
      }
    }
  });

  it("★DESIGN.md が避けると決めた言い回しを使わない", () => {
    const joined = ALL_VISIBLE_COPY.join("");
    for (const phrase of AVOID_PHRASES) {
      expect(joined, `避けるべき言い回し: ${phrase}`).not.toContain(phrase);
    }
  });

  it("ヒーローは「キミの／現在地／を、刻む。」の3段", () => {
    expect(HERO_LINES).toEqual(["キミの", "現在地", "を、刻む。"]);
  });

  it("★ヒーローにアプリ名を出さない（ヘッダーに既にあり繰り返しになる）", () => {
    const hero = [...HERO_LINES, HERO_SUB].join("");
    expect(hero).not.toContain("すれ違ひ通信");
    expect(hero).not.toContain("君斗りんく");
  });

  it("読み上げラベルは3段を1文にしたもの", () => {
    expect(HERO_ARIA_LABEL).toBe("キミの現在地を刻む");
  });

  it("ヘッダーはアプリ名を旧仮名で出す", () => {
    expect(APP_NAME).toBe("君斗りんくのすれ違ひ通信");
  });

  it("★4.3(a) 対応で確定した CTA の文言を変えない", () => {
    expect(CTA_LABEL).toBe("1タップではじめる");
    expect(CTA_NOTE).toBe("無料・1タップ / 新規登録もこちら");
  });

  it("要点は3つで、ラベルと図形がそろっている", () => {
    expect(BENEFITS).toHaveLength(3);
    for (const b of BENEFITS) {
      expect(b.label.length).toBeGreaterThan(0);
      // SVG の path は "M" から始まる（空や壊れた値を弾く）。
      expect(b.path).toMatch(/^M[\s\d]/);
    }
    expect(BENEFITS.map((b) => b.label)).toEqual(["足あと", "封筒", "すれ違ひ"]);
  });

  it("★説明文を増やして画面を埋めない（Anti-Slop の数値計器）", () => {
    const total = ALL_VISIBLE_COPY.join("").length;
    // 旧版の実測が約60文字。余裕を見て140文字を上限にする。
    expect(
      total,
      `画面の文字数が ${total} 字。説明を足しすぎていないか見直す`,
    ).toBeLessThanOrEqual(140);
  });

  it("レーダーのキャプションがある", () => {
    expect(RADAR_CAPTION).toBe("封筒が届くかも");
  });
});
