/**
 * iOS PWA スプラッシュ（apple-touch-startup-image）の解像度カバレッジ回帰テスト。
 *
 * 背景（2026-08-16 iPhone 16 Pro Max の実機録画で判明）:
 * ホーム画面から起動してもスプラッシュが一度も出ず、いきなり本体画面が現れていた。
 * 原因は 1320x2868（16 Pro Max）の定義が無かったこと。iOS は解像度が一致しない
 * apple-touch-startup-image を**無視する**ので、1つでも抜けるとその機種だけ無地になる。
 * media 無しのフォールバックも、解像度違いだと当てにできない。
 *
 * ここで守りたい失敗:
 *   1. 主要機種の解像度が定義から抜ける（その機種だけスプラッシュ無し）
 *   2. HTML と生成スクリプトの対応表がズレる（片方だけ足して画像が無い/使われない）
 *   3. 参照している画像ファイルが実在しない
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");
const PY_SRC = readFileSync(resolve(ROOT, "scripts/sync-brand-icons.py"), "utf8");

/**
 * 実機で確認が必要な主要解像度（実ピクセル）と、対応する論理サイズ。
 * 新機種を扱うようになったらここに足す。足すと下のテストが落ちるので、
 * HTML と sync-brand-icons.py の両方を直すことになる。
 */
const REQUIRED = [
  { px: [1320, 2868], logical: [440, 956], name: "iPhone 16 Pro Max" },
  { px: [1206, 2622], logical: [402, 874], name: "iPhone 16 Pro" },
  { px: [1290, 2796], logical: [430, 932], name: "iPhone 14/15 Pro Max" },
  { px: [1179, 2556], logical: [393, 852], name: "iPhone 14 Pro/15/16" },
  { px: [1170, 2532], logical: [390, 844], name: "iPhone 12/13/14" },
] as const;

describe("iOS PWA スプラッシュのカバレッジ", () => {
  it.each(REQUIRED)("$name ($px) の画像が実在する", ({ px }) => {
    const file = resolve(ROOT, `public/splash/ios-${px[0]}x${px[1]}.png`);
    expect(existsSync(file)).toBe(true);
  });

  it.each(REQUIRED)("$name が +html.tsx から参照されている", ({ px }) => {
    expect(HTML_SRC).toContain(`/splash/ios-${px[0]}x${px[1]}.png`);
  });

  it.each(REQUIRED)("$name の media query が論理サイズで書かれている", ({ logical }) => {
    // iOS の media は CSS 論理ピクセル。実ピクセルで書くと一致せず無視される。
    const re = new RegExp(
      `device-width:\\s*${logical[0]}px\\)\\s*and\\s*\\(device-height:\\s*${logical[1]}px`,
    );
    expect(HTML_SRC).toMatch(re);
  });

  it.each(REQUIRED)("$name が生成スクリプトの一覧にもある（HTMLだけ足すのを防ぐ）", ({ px }) => {
    const re = new RegExp(`\\(\\s*${px[0]}\\s*,\\s*${px[1]}\\s*,`);
    expect(PY_SRC).toMatch(re);
  });

  it("media 無しのフォールバックが1つある（未知の新機種の保険）", () => {
    const withoutMedia = HTML_SRC.match(
      /<link\s+rel="apple-touch-startup-image"\s+href="\/splash\/ios-fallback\.png"\s*\/>/,
    );
    expect(withoutMedia).not.toBeNull();
    expect(existsSync(resolve(ROOT, "public/splash/ios-fallback.png"))).toBe(true);
  });
});
