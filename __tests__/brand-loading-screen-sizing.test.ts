/**
 * 起動画面の絵の寸法。小さすぎるとブランドが伝わらず、はみ出すとタグラインが切れる。
 */
import { describe, it, expect } from "vitest";
import { splashArtSize } from "../lib/splash-art-size";

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

describe("起動画面の絵の寸法", () => {
  it.each(DEVICES)("%s (%ix%i): 絵が小さすぎない", (_name, w, h) => {
    expect(splashArtSize(w, h).width).toBeGreaterThanOrEqual(200);
  });

  it.each(DEVICES)("%s (%ix%i): 高さが画面の 86% を超えない", (_name, w, h) => {
    expect(splashArtSize(w, h).height).toBeLessThanOrEqual(h * 0.86 + 0.5);
  });

  it("大画面では幅 420 で頭打ち", () => {
    expect(splashArtSize(1280, 800).width).toBe(420);
    expect(splashArtSize(768, 1024).width).toBe(420);
  });

  it("ビューポートが 0 でも絵が消えない", () => {
    for (const [w, h] of [
      [0, 0],
      [0, 812],
      [375, 0],
    ] as const) {
      const size = splashArtSize(w, h);
      expect(size.width).toBe(300);
      expect(size.height).toBeGreaterThan(0);
    }
  });

  it("縦が短いときは高さ基準で縮む", () => {
    const size = splashArtSize(844, 390);
    expect(size.height).toBeCloseTo(390 * 0.86, 5);
    expect(size.width).toBeLessThan(420);
  });
});
