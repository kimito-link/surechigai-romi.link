/**
 * 共有の待機画面が「ロゴとキャラでファーストビューを覆う」ことを守る。
 *
 * ★2026-08-19 指示: 「ファーストビューを覆うくらいにロゴとゆっくりりんくの
 *   キャラを入れて」と言われていたのに守れていなかった。
 *   実際は max-width 440px の小さなカードで、**キャラ画像は1枚も入っていなかった**
 *   （ロゴ + 絵文字の足あとだけ）。
 *
 * 実測(390x844)で ロゴ 265x199px / キャラ 226x226px / 全体が画面高の 69%。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(__dirname, "../lib/share-waiting-screen.ts"),
  "utf8",
);

describe("共有待機画面", () => {
  it("キャラクター画像が入っている", () => {
    // 絵文字ではなく実際のキャラ画像であること
    expect(SRC).toContain("SHARE_WAITING_CHARACTER_DATA_URI");
    expect(SRC).toMatch(/<img[^>]*class="chara"/);
  });

  it("ロゴとキャラが十分に大きい（ファーストビューを覆う）", () => {
    // 小さなサムネイルに戻されたら落とす。
    const logo = SRC.match(/\.logo\s*\{[\s\S]*?width:\s*min\((\d+)px/);
    const chara = SRC.match(/\.chara\s*\{[\s\S]*?width:\s*min\((\d+)px/);
    expect(logo, ".logo の width が読めない").not.toBeNull();
    expect(chara, ".chara の width が読めない").not.toBeNull();
    expect(Number(logo![1])).toBeGreaterThanOrEqual(240);
    expect(Number(chara![1])).toBeGreaterThanOrEqual(200);
  });

  it("画面全体を使う（小さなカードに閉じ込めない）", () => {
    // .wrap が viewport 高いっぱいを使って中央寄せしていること
    const wrap = SRC.match(/\.wrap\s*\{[\s\S]*?\}/);
    expect(wrap, ".wrap が読めない").not.toBeNull();
    expect(wrap![0]).toContain("min-height: 100vh");
    expect(wrap![0]).toContain("align-items: center");
  });

  it("外部リソースを参照しない（about:blank の制約）", () => {
    // data URI 以外の画像URLを書いてはいけない
    expect(SRC).not.toMatch(/<img[^>]*src="https?:/);
  });
});
