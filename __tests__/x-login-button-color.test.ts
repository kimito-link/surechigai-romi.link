/**
 * 「𝕏 1タップではじめる」ボタンは X のブランドの黒（palette.xBlack = #0F1419）にする（2026-10-12 本人指示）。
 *
 * 理由: X のボタンだと一目で分かる。ログイン画面の Clerk の「X / Twitterで続ける」（黒）とも印象がそろう。
 * 色の正本は DESIGN.md「CTA」の `#0F1419`（X）。#RRGGBB は theme/tokens/palette.ts にだけ置く。
 *
 * ★ネイティブアプリ(App Store 審査対象)の「はじめる」は X を名指ししない（Apple も選べる。Guideline 4.8）ので、
 *   従来の紺（kimitoBlue）のまま。ここを黒にすると「X ログインしかない」と見えて却下の一因になる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { palette } from "../theme/tokens/palette";

const ROOT = resolve(__dirname, "..");
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

/** WCAG の相対輝度とコントラスト比 */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("X のボタンの黒", () => {
  it("palette.xBlack は DESIGN.md の X の黒（#0F1419）", () => {
    expect(palette.xBlack.toUpperCase()).toBe("#0F1419");
    expect(read("DESIGN.md")).toContain("#0F1419");
  });

  it("白文字との対比が AA(4.5) 以上（実際は約18）", () => {
    expect(contrast(palette.xBlack, palette.white)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("KimitoLoginCta（メインの「𝕏 1タップではじめる」）", () => {
  const src = read("components/molecules/kimito-login-cta.tsx");

  it("X を名指しする（ネイティブ以外）ときは xBlack、ネイティブは従来の紺", () => {
    expect(src).toMatch(/xButtonStyle\s*=\s*\{\s*\.\.\.buttonStyle,\s*backgroundColor:\s*palette\.xBlack\s*\}/);
    expect(src).toMatch(/baseButtonStyle\s*=\s*isNative\s*\?\s*buttonStyle\s*:\s*xButtonStyle/);
    // 既定（ネイティブ側）の地は紺のまま
    expect(src).toMatch(/const buttonStyle = \{[\s\S]*?backgroundColor:\s*palette\.kimitoBlue,/);
  });

  it("Web も Pressable（ネイティブ）も baseButtonStyle を使い、地色を直書きしない", () => {
    expect(src.match(/baseButtonStyle,/g)?.length).toBe(2);
    expect(src).not.toMatch(/backgroundColor:\s*["']#/);
  });
});

describe("ゲストのヘッダーの「𝕏 1タップ」", () => {
  it("同じ X のログインなので、メインのボタンと同じ xBlack", () => {
    const src = read("components/post/guest-home-shell-header.tsx");
    const loginLink = src.slice(src.indexOf("loginLink: {"), src.indexOf("loginLinkGlyphOnly: {"));
    expect(loginLink.length).toBeGreaterThan(50);
    expect(loginLink).toContain("backgroundColor: palette.xBlack");
    expect(loginLink).not.toContain("palette.kimitoBlue");
  });
});
