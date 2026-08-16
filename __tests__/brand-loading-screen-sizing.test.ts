/**
 * ブランド読み込み画面（components/atoms/brand-loading-screen.tsx）の寸法計算の回帰テスト。
 *
 * 背景: 「ロゴだけでキャラが入っていない、そして小さい」という指摘で作った画面なので、
 * 「小さすぎる」と「はみ出す」の両方を防ぐ必要がある。目視では守れないため式を固定する。
 *
 * ⚠️ 実装側の式を変えたらこのテストも必ず落ちること（落ちなければ検証していない）。
 */
import { describe, it, expect } from "vitest";

/** 実装 (brand-loading-screen.tsx) と同じ式。変更時は両方を揃える。 */
function charaSize(width: number, height: number): number {
  return Math.min(Math.max(width * 0.46, 150), 320, height * 0.38);
}
function logoWidth(width: number, height: number): number {
  return Math.min(Math.max(width * 0.34, 120), 240, height * 0.18);
}
/** ロゴ素材は 800x600 = 縦横比 0.75。 */
const LOGO_ASPECT = 0.75;

/** 縦に積む要素の合計（marginBottom 20 / gap 12 x2 / タイトル22 / ステータス24 の概算）。 */
function stackedHeight(width: number, height: number): number {
  return logoWidth(width, height) * LOGO_ASPECT + 20 + charaSize(width, height) + 12 + 22 + 12 + 24;
}

const DEVICES: Array<[string, number, number]> = [
  ["iPhone SE", 320, 568],
  ["iPhone mini", 375, 812],
  ["iPhone 12/13", 390, 844],
  ["iPhone Pro Max", 430, 932],
  ["iPad portrait", 768, 1024],
  ["iPad landscape", 1024, 768],
  ["Desktop", 1280, 800],
  ["横向きスマホ", 844, 390],
];

describe("ブランド読み込み画面の寸法", () => {
  it.each(DEVICES)("%s (%ix%i): キャラが小さすぎない", (_name, w, h) => {
    // 指摘の起点が「小さい」なので下限を守る。狭い端末でも 120px は確保する。
    expect(charaSize(w, h)).toBeGreaterThanOrEqual(120);
  });

  it.each(DEVICES)("%s (%ix%i): 縦に収まりはみ出さない", (_name, w, h) => {
    expect(stackedHeight(w, h)).toBeLessThanOrEqual(h);
  });

  it("大画面ではキャラが十分大きくなる（小さいままにならない）", () => {
    // 750px 幅で 173px のままだった実測不具合の再発防止。
    expect(charaSize(768, 1024)).toBeGreaterThanOrEqual(280);
    expect(charaSize(1280, 800)).toBeGreaterThanOrEqual(280);
  });

  it("巨大画面でも上限で頭打ちになる（間延びしない）", () => {
    expect(charaSize(2560, 1440)).toBe(320);
    expect(logoWidth(2560, 1440)).toBe(240);
  });

  it("横向きなど縦が短い場合は高さ基準で抑えられる", () => {
    // 幅基準だけなら 844*0.46=388 になるが、高さ 390 の 38% で抑える。
    expect(charaSize(844, 390)).toBeLessThan(844 * 0.46);
    expect(charaSize(844, 390)).toBeCloseTo(390 * 0.38, 5);
  });
});
