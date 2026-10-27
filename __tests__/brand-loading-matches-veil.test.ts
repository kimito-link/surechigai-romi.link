/**
 * Web の待機画面が、ブートベールと同じ絵であることの回帰テスト。
 * ロゴとスピナーを別に組むと、切り替わりのたびに絵が飛ぶ。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const LOADING_SRC = readFileSync(resolve(ROOT, "components/atoms/brand-loading-screen.tsx"), "utf8");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");

describe("待機画面はブートベールと同じ絵", () => {
  it("地色・幅・タグラインを BOOT から取る", () => {
    for (const key of ["background", "artWidth", "tagline"] as const) {
      expect(LOADING_SRC).toContain(`BOOT.${key}`);
      expect(HTML_SRC).toContain(`BOOT.${key}`);
    }
    expect(LOADING_SRC).toContain("BOOT.splashSrc");
    expect(HTML_SRC).toContain("BOOT_SPLASH_DATA_URI");
  });

  it("Web の絵は CSS の背景画像（expo-image のデコード待ちで1コマ消えない）", () => {
    const web = LOADING_SRC.slice(
      LOADING_SRC.indexOf('Platform.OS === "web" && fullscreen'),
      LOADING_SRC.indexOf("styles.fill, styles.center"),
    );
    expect(web.length).toBeGreaterThan(80);
    const code = web.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).toContain("backgroundImage");
    expect(code).toContain("BOOT.splashSrc");
    expect(code).not.toMatch(/<Image\b/);
  });

  it("起動が終わったあとは同じ絵を出さない", () => {
    expect(LOADING_SRC).toContain("isBootVeilReleased()");
  });

  it("スピナーのクラスをベールに戻していない", () => {
    expect(HTML_SRC).not.toContain("romi-boot-spinner");
  });
});
