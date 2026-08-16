/**
 * iOS PWA スプラッシュ（apple-touch-startup-image）のカバレッジ回帰テスト。
 *
 * 背景（2026-08-16 iPhone 16 Pro Max の実機録画で判明）:
 * ホーム画面から起動してもスプラッシュが一度も出ず、いきなり本体画面が現れていた。
 * 原因は解像度表を**手で維持していた**こと。公式20解像度のうち9件しか無く、
 * 1320x2868 が欠けていた。iOS は解像度が一致しない apple-touch-startup-image を
 * **無視する**ので、1つでも抜けるとその機種だけ無地になる。
 *
 * 対策として表を公式仕様データ駆動に変えた:
 *   正本      scripts/data/ios-launch-sizes.json（pnpm splash:sync で更新）
 *   linkタグ  app/+html.tsx の SPLASH-LINKS ブロック（同スクリプトが生成）
 *   画像      public/splash/ios-<w>x<h>.png（pnpm brand:icons が生成）
 *
 * このテストは「3者がズレていないこと」を守る。手で片方だけ直すと落ちる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");
const SPEC = JSON.parse(
  readFileSync(resolve(ROOT, "scripts/data/ios-launch-sizes.json"), "utf8"),
) as {
  portrait: Array<{ px: [number, number]; logical: [number, number]; dpr: number; device: string }>;
};

/** 実機で被害が出た機種は、名指しで存在を保証する（表が痩せる事故の検知） */
const MUST_HAVE_PX: Array<[number, number]> = [
  [1320, 2868], // iPhone 16/17 Pro Max — 実際にスプラッシュが出ていなかった機種
  [1206, 2622], // iPhone 16/17 Pro
  [1290, 2796], // iPhone 14/15/16 Plus・Pro Max
  [1179, 2556], // iPhone 14 Pro/15/16
  [1170, 2532], // iPhone 12/13/14
];

describe("iOS PWA スプラッシュのカバレッジ", () => {
  it("公式仕様の解像度を十分な数カバーしている", () => {
    // 手書き時代は9件だった。20件前後が公式の想定。
    expect(SPEC.portrait.length).toBeGreaterThanOrEqual(18);
  });

  it.each(MUST_HAVE_PX)("被害機種 %ix%i が仕様表にある", (w, h) => {
    const hit = SPEC.portrait.find((s) => s.px[0] === w && s.px[1] === h);
    expect(hit).toBeDefined();
  });

  it("仕様表の全解像度について、画像・linkタグ・media が揃っている", () => {
    const missingImage: string[] = [];
    const missingLink: string[] = [];
    const missingMedia: string[] = [];

    for (const { px, logical, dpr } of SPEC.portrait) {
      const name = `ios-${px[0]}x${px[1]}.png`;
      if (!existsSync(resolve(ROOT, `public/splash/${name}`))) missingImage.push(name);
      if (!HTML_SRC.includes(`/splash/${name}`)) missingLink.push(name);

      // iOS の media は CSS 論理ピクセル。実ピクセルで書くと一致せず無視される。
      const re = new RegExp(
        `device-width:\\s*${logical[0]}px\\)\\s*and\\s*\\(device-height:\\s*${logical[1]}px\\)` +
          `\\s*and\\s*\\(-webkit-device-pixel-ratio:\\s*${dpr}\\)`,
      );
      if (!re.test(HTML_SRC)) missingMedia.push(name);
    }

    expect({ missingImage, missingLink, missingMedia }).toEqual({
      missingImage: [],
      missingLink: [],
      missingMedia: [],
    });
  });

  it("linkタグは自動生成ブロックの中にある（手書きに戻っていない）", () => {
    expect(HTML_SRC).toContain("SPLASH-LINKS:BEGIN");
    expect(HTML_SRC).toContain("SPLASH-LINKS:END");
    const begin = HTML_SRC.indexOf("SPLASH-LINKS:BEGIN");
    const end = HTML_SRC.indexOf("SPLASH-LINKS:END");
    const block = HTML_SRC.slice(begin, end);
    // media 付きの link は全て自動生成ブロック内に収まっていること
    const totalWithMedia = (HTML_SRC.match(/rel="apple-touch-startup-image"[\s\S]{0,400}?media=/g) ?? []).length;
    const inBlock = (block.match(/rel="apple-touch-startup-image"/g) ?? []).length;
    expect(inBlock).toBe(totalWithMedia);
  });

  it("media 無しのフォールバックが1つある（未知の新機種の保険）", () => {
    expect(HTML_SRC).toMatch(
      /<link\s+rel="apple-touch-startup-image"\s+href="\/splash\/ios-fallback\.png"\s*\/>/,
    );
    expect(existsSync(resolve(ROOT, "public/splash/ios-fallback.png"))).toBe(true);
  });

  it("仕様データは手編集を禁止する注意書きを持つ", () => {
    const raw = readFileSync(resolve(ROOT, "scripts/data/ios-launch-sizes.json"), "utf8");
    expect(raw).toContain("splash:sync");
  });
});
