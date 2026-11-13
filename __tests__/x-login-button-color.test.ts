/**
 * ログインのボタンは kimito.link 本体と同じ紺（palette.kimitoBlue）にする（2026-11-13 本人指示）。
 *
 * 経緯: 2026-10-12 に「X のボタンだと一目で分かる」よう X の黒（#0F1419）にしたが、
 * 2026-11-13 に「すれ違ひ通信を kimito.link の一部に見せる」方針へ変えた。
 * 本体の「X で今すぐ参加する」は紺なので、それにそろえる（𝕏 の字で X のボタンだとは分かる）。
 *
 * ★ネイティブアプリ(App Store 審査対象)では X を名指ししない（Apple も選べる。Guideline 4.8）。
 *   ゲストのヘッダーもネイティブでは「ログイン」と出す。
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

describe("ログインのボタンの紺", () => {
  it("白文字との対比が AA(4.5) 以上", () => {
    expect(contrast(palette.kimitoBlue, palette.white)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("KimitoLoginCta（メインのログインボタン）", () => {
  const src = read("components/molecules/kimito-login-cta.tsx");

  it("X を名指しする（ネイティブ以外）ときも、ネイティブも紺", () => {
    expect(src).toMatch(/xButtonStyle\s*=\s*\{\s*\.\.\.buttonStyle,\s*backgroundColor:\s*palette\.kimitoBlue\s*\}/);
    expect(src).toMatch(/baseButtonStyle\s*=\s*isNative\s*\?\s*buttonStyle\s*:\s*xButtonStyle/);
    expect(src).toMatch(/const buttonStyle = \{[\s\S]*?backgroundColor:\s*palette\.kimitoBlue,/);
  });

  it("Web も Pressable（ネイティブ）も baseButtonStyle を使い、地色を直書きしない", () => {
    expect(src.match(/baseButtonStyle,/g)?.length).toBe(2);
    expect(src).not.toMatch(/backgroundColor:\s*["']#/);
  });
});

describe("ゲストのヘッダーのログインボタン", () => {
  const src = read("components/post/guest-home-shell-header.tsx");

  it("メインのボタンと同じ紺", () => {
    const loginLink = src.slice(src.indexOf("loginLink: {"), src.indexOf("loginLinkGlyphOnly: {"));
    expect(loginLink.length).toBeGreaterThan(50);
    expect(loginLink).toContain("backgroundColor: palette.kimitoBlue");
    expect(loginLink).not.toContain("palette.xBlack");
  });

  it("ネイティブでは X を名指ししない（𝕏 の字はネイティブ以外だけ）", () => {
    expect(src).toMatch(/!native \? <Text style=\{styles\.loginGlyph\}/);
    expect(src).toContain('native ? "ログイン"');
  });
});
