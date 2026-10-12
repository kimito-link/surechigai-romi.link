/**
 * Web の待機画面（BrandLoadingScreen）が、ブートベールと同じ絵・同じ位置であることの回帰テスト。
 *
 * 背景（2026-10-12 Android 実機の起動録画）:
 * ベール解除の直後に「アイコンの無い文字だけの画面 → ロゴ＋ゆっくりりんく（ベールとは別の絵）」と
 * 切り替わり、絵と位置が飛んでいた（ちかちか）。
 * ここで守る: 両方が theme/tokens/boot.ts の BOOT（値の唯一の正本）から取っていること、
 * マークは画面中央に固定され、タイトル+スピナーは別枠なこと。
 * （値そのものの直書き禁止は __tests__/boot-single-source.test.ts が見張る）
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const LOADING_SRC = readFileSync(resolve(ROOT, "components/atoms/brand-loading-screen.tsx"), "utf8");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");

describe("Web の待機画面はブートベールと同じ絵・同じ位置", () => {
  it("マークの大きさ・絵・間隔・タイトルを、ベールと待機画面の両方が BOOT から取っている", () => {
    for (const key of ["markSize", "markSrc", "metaGap", "title"] as const) {
      expect(LOADING_SRC).toContain(`BOOT.${key}`);
      expect(HTML_SRC).toContain(`BOOT.${key}`);
    }
  });

  it("マークは画面中央に固定され、タイトル+スピナーは別枠（マークの位置に影響しない）", () => {
    const mark = LOADING_SRC.slice(LOADING_SRC.indexOf("webMark: {"), LOADING_SRC.indexOf("webMeta: {"));
    expect(mark).toContain('position: "absolute"');
    expect(mark).toContain('top: "50%"');
    expect(mark).toContain('left: "50%"');
    expect(LOADING_SRC).toContain("styles.webMeta");
  });

  it("Web のマークは CSS の背景画像で描く（expo-image の非同期デコードで最初の1コマが消えるのを防ぐ）", () => {
    // ★2026-10-12 実機の起動録画: expo-image だとベール解除→待機画面の1コマ（約14ms）だけマークが消えた。
    // Web 分岐（Platform.OS === "web" の if）から、ネイティブ側の return（styles.container）の手前まで
    const web = LOADING_SRC.slice(
      LOADING_SRC.indexOf('Platform.OS === "web" && fullscreen'),
      LOADING_SRC.indexOf("styles.container"),
    );
    expect(web.length).toBeGreaterThan(200);
    // 経緯を書いたコメントに <Image> が出てくるので、コメントを除いてから見る
    const code = web.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).toContain("backgroundImage");
    expect(code).toContain("BOOT.markSrc");
    expect(code).not.toMatch(/<Image\b/);
  });

  it("Web かつフルスクリーンのときだけ新レイアウトにする（ネイティブ・部分表示は従来どおり）", () => {
    expect(LOADING_SRC).toMatch(/Platform\.OS === "web" && fullscreen/);
  });
});
