/**
 * 起動画面の値は theme/tokens/boot.ts の BOOT が唯一の正本であることの契約テスト。
 *
 * 背景（2026-10-12 Android 実機の起動録画）:
 * 地色 #E2EDF7 が約10か所に、マークの大きさ・絵がベールと待機画面の2か所に手書きされていて、
 * 食い違ったまま切り替わりでアイコンが飛んでいた。「あとから一致をテストする」のでなく
 * 「そもそも直書きさせない」ために、値を BOOT に1つだけ置く。
 *
 * ここで守る:
 *   1. 直接参照する側（+html.tsx / BrandLoadingScreen）が、値を直書きせず BOOT から取る
 *   2. 参照できない静的ファイル（manifest.json / package.json / app.config.ts）は、値が BOOT と同じ
 *      ★app.config.ts から BOOT を import してはいけない（Expo の設定読み込みが無言で失敗する。2026-10-12 確認）
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BOOT } from "../theme/tokens/boot";
import { palette } from "../theme/tokens/palette";
import { BOOT_SPLASH_DATA_URI } from "../theme/tokens/boot-splash-data";

const ROOT = resolve(__dirname, "..");
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

/** コメント（/* … *\/ と // …）を取り除く。経緯を書いた説明文に値が出てくるのは許す。 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("BOOT は palette から作られている（色の正本は palette）", () => {
  it("background は palette.kimitoBlueSoft、titleColor は palette.kimitoBlue", () => {
    expect(BOOT.background).toBe(palette.kimitoBlueSoft);
    expect(BOOT.titleColor).toBe(palette.kimitoBlue);
  });
});

describe("参照する側は値を直書きしない", () => {
  const FILES = ["app/+html.tsx", "components/atoms/brand-loading-screen.tsx"];

  it.each(FILES)("%s は BOOT をインポートしている", (rel) => {
    expect(read(rel)).toMatch(/import\s*\{\s*BOOT\s*\}\s*from\s*"@\/theme\/tokens\/boot"/);
  });

  it.each(FILES)("%s に地色 #E2EDF7 の直書きが無い（コメントは除く）", (rel) => {
    expect(stripComments(read(rel))).not.toMatch(/#E2EDF7/i);
  });

  it.each(FILES)("%s にマークの大きさの式 clamp(…vw…) の直書きが無い", (rel) => {
    expect(stripComments(read(rel))).not.toMatch(/clamp\([^)]*vw[^)]*\)/);
  });

  it.each(FILES)("%s にマーク画像の URL 文字列 \"/boot-mark.png\" の直書きが無い", (rel) => {
    expect(stripComments(read(rel))).not.toMatch(/["'`(]\/boot-mark\.png/);
  });

  it("起動画面のタグラインは BOOT.tagline を参照する（文言の直書きはしない）", () => {
    expect(read("app/+html.tsx")).toContain("{BOOT.tagline}");
    const loading = stripComments(read("components/atoms/brand-loading-screen.tsx"));
    expect(loading).toContain("BOOT.tagline");
    expect(loading).not.toContain(BOOT.tagline);
  });
});

describe("参照できない静的ファイルは BOOT と同じ値", () => {
  const manifest = JSON.parse(read("public/manifest.json")) as {
    background_color?: string;
    theme_color?: string;
  };

  it("manifest.json の background_color / theme_color が BOOT.background", () => {
    expect(manifest.background_color?.toUpperCase()).toBe(BOOT.background.toUpperCase());
    expect(manifest.theme_color?.toUpperCase()).toBe(BOOT.background.toUpperCase());
  });

  it("package.json の check:pwa-splash の --expect-bg が BOOT.background", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    const m = pkg.scripts["check:pwa-splash"]?.match(/--expect-bg\s+\\?"?(#[0-9A-Fa-f]{6})/);
    expect(m, "check:pwa-splash に --expect-bg が無い").not.toBeNull();
    expect(m![1].toUpperCase()).toBe(BOOT.background.toUpperCase());
  });

  it("app.config.ts のスプラッシュ（expo-splash-screen）の backgroundColor が BOOT.background", () => {
    const cfg = read("app.config.ts");
    const at = cfg.indexOf('"expo-splash-screen"');
    expect(at, "expo-splash-screen の設定が見つからない").toBeGreaterThan(-1);
    const m = cfg.slice(at, at + 8000).match(/backgroundColor:\s*"(#[0-9A-Fa-f]{6})"/);
    expect(m, "expo-splash-screen の backgroundColor が見つからない").not.toBeNull();
    expect(m![1].toUpperCase()).toBe(BOOT.background.toUpperCase());
  });

  it("app.config.ts は BOOT を import していない（Expo の設定読み込みが無言で失敗するため）", () => {
    expect(read("app.config.ts")).not.toMatch(/theme\/tokens\/boot/);
  });
});

function channel(hex: string, shift: number): number {
  const s = ((parseInt(hex.slice(1), 16) >> shift) & 255) / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function contrast(fg: string, bg: string): number {
  const L = (hex: string) => 0.2126 * channel(hex, 16) + 0.7152 * channel(hex, 8) + 0.0722 * channel(hex, 0);
  const a = L(fg);
  const b = L(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("起動は同じ絵を1枚出してから、短いフェードが1回", () => {
  const config = read("app.config.ts");
  const html = read("app/+html.tsx");
  const entry = read("index.js");

  it("userInterfaceStyle は light（dark だと名前付き色の起動画面が黒になる）", () => {
    expect(config).toMatch(/userInterfaceStyle:\s*"light"/);
    const splashAt = config.indexOf('"expo-splash-screen"');
    const splashEnd = config.indexOf('"expo-system-ui"', splashAt);
    expect(config.slice(splashAt, splashEnd)).not.toMatch(/\bdark\s*:/);
  });

  it("ネイティブの起動画面はルーターより前に握り、フェード時間は BOOT.fadeMs", () => {
    const prevent = entry.indexOf("preventAutoHideAsync");
    const router = entry.indexOf('require("expo-router/entry")');
    expect(prevent).toBeGreaterThan(-1);
    expect(prevent).toBeLessThan(router);
    expect(entry).toContain(`duration: ${BOOT.fadeMs}`);
    expect(entry).toContain("fade: true");
  });

  it("Web は最初の HTML から起動画面を出し、スピナーは無い", () => {
    expect(html).toMatch(/<html[^>]*data-auth-boot="1"/);
    expect(html).toContain("prefers-reduced-motion: reduce");
    expect(html).not.toContain("romi-boot-spinner");
    expect(html).toContain('background-image: url("${BOOT_SPLASH_DATA_URI}")');
    expect(BOOT_SPLASH_DATA_URI.length / 1024).toBeLessThanOrEqual(80);
  });

  it("タグラインの文字色は地色に対して 4.5:1 以上", () => {
    expect(BOOT.tagline).toBe("キミの現在地を、刻む。");
    expect(contrast(BOOT.titleColor, BOOT.background)).toBeGreaterThanOrEqual(4.5);
  });
});
