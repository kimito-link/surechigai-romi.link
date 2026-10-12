/**
 * Web の待機画面（BrandLoadingScreen）が、ブートベールと同じ絵・同じ位置であることの回帰テスト。
 *
 * 背景（2026-10-12 Android 実機の起動録画）:
 * ベール解除の直後に「アイコンの無い文字だけの画面 → ロゴ＋ゆっくりりんく（ベールとは別の絵）」と
 * 切り替わり、絵と位置が飛んでいた（ちかちか）。
 * ここで守る: ベールと同じマーク(/boot-mark.png)・同じ大きさの式・画面中央の固定。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const LOADING_SRC = readFileSync(resolve(ROOT, "components/atoms/brand-loading-screen.tsx"), "utf8");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");

/** ベール側の大きさの式（--romi-boot-mark）を取り出す。 */
function veilMarkSize(): string {
  const m = HTML_SRC.match(/--romi-boot-mark:\s*(clamp\([^)]*\))/);
  if (!m) throw new Error("+html.tsx に --romi-boot-mark が見つからない");
  return m[1];
}

describe("Web の待機画面はブートベールと同じ絵・同じ位置", () => {
  it("マークの大きさの式がベールと同じ（片方だけ直して再びズレるのを防ぐ）", () => {
    expect(LOADING_SRC).toContain(`WEB_MARK_SIZE = "${veilMarkSize()}"`);
  });

  it("ベールと同じ /boot-mark.png を使う（別の絵に戻さない）", () => {
    expect(LOADING_SRC).toContain('uri: "/boot-mark.png"');
  });

  it("マークは画面中央に固定され、タイトル+スピナーは別枠（マークの位置に影響しない）", () => {
    const mark = LOADING_SRC.slice(LOADING_SRC.indexOf("webMark: {"), LOADING_SRC.indexOf("webMeta: {"));
    expect(mark).toContain('position: "absolute"');
    expect(mark).toContain('top: "50%"');
    expect(mark).toContain('left: "50%"');
    expect(LOADING_SRC).toContain("styles.webMeta");
  });

  it("Web かつフルスクリーンのときだけ新レイアウトにする（ネイティブ・部分表示は従来どおり）", () => {
    expect(LOADING_SRC).toMatch(/Platform\.OS === "web" && fullscreen/);
  });
});
