import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Next.js 側（apps/web/lib/brand-tokens.ts）の色が、旧 Expo 側の正本
 * （theme/tokens/palette.ts）とずれていないことを固定する。
 *
 * ★なぜ要るか: 移植が終わるまで色の定義が**2系統併存**する。
 *   ずれると「起動中に地色が飛ぶ」事故（docs/symptoms.md SG-09）の再発になる。
 *   2026-10-12 の実測では、旧側に #E2EDF7 と #F0F4F8 が混在していたのが
 *   まさにこの型の不整合だった。
 *
 * ★ファイルを**テキストとして読む**のは、palette.ts を import すると
 *   react-native 依存を引き込むため（Next.js 側では読めない）。
 */
const CANONICAL = readFileSync(join(process.cwd(), "theme/tokens/palette.ts"), "utf8");
const COPY = readFileSync(join(process.cwd(), "apps/web/lib/brand-tokens.ts"), "utf8");

/** `name: "#RRGGBB"` を拾う（値の後ろにコメントが続く形にも対応）。 */
function hexOf(source: string, key: string): string | null {
  const m = source.match(new RegExp(`\\b${key}\\s*:\\s*["'](#[0-9A-Fa-f]{6})`));
  return m ? m[1].toUpperCase() : null;
}

const PAIRS: ReadonlyArray<readonly [canonical: string, copy: string]> = [
  ["kimitoBlue", "blue"],
  ["kimitoBlueSoft", "blueSoft"],
  ["kimitoOrange", "orange"],
  ["kimitoOrangeText", "orangeText"],
  ["kimitoInkMuted", "inkMuted"],
  ["kimitoBorderSoft", "borderSoft"],
  ["white", "white"],
];

describe("brand-tokens: 旧 Expo 側の正本と一致", () => {
  it.each(PAIRS)("%s === %s", (canonicalKey, copyKey) => {
    const expected = hexOf(CANONICAL, canonicalKey);
    const actual = hexOf(COPY, copyKey);

    // ★両方が実在することを先に確かめる（null 同士の比較で偽の緑を作らない）
    expect(expected, `正本に ${canonicalKey} が無い`).toMatch(/^#[0-9A-F]{6}$/);
    expect(actual, `写しに ${copyKey} が無い`).toMatch(/^#[0-9A-F]{6}$/);
    expect(actual).toBe(expected);
  });

  it("ページ地は起動ベールと同じ1色（SG-09 の契約）", () => {
    // ★#F0F4F8 を使うと起動中に地色が飛ぶ。bg は blueSoft と同値であること。
    expect(hexOf(COPY, "bg")).toBe(hexOf(COPY, "blueSoft"));
    expect(hexOf(COPY, "bg")).toBe("#E2EDF7");
  });
});
