/**
 * 日本地図（都道府県ブロック）のレイアウト計算を固定する。
 *
 * この計算は2度ユーザー報告の事故を起こしている:
 * 1. 2026-07-31: 素直に画面幅を14分割し、スマホでセルが潰れて県名が読めなかった
 * 2. 2026-08-01: 下限44pxを入れて横スクロールに逃がしたが、
 *    ScrollView が幅を持てずスクロール不能のまま左右が見切れた
 *
 * よって「どの画面幅でも必ず収まる」ことと「フォントが読める大きさ」を
 * 両方テストで固定する。固定下限セルサイズを再導入すると 2. が再発する。
 */
import { describe, expect, it } from "vitest";
import { computeMapLayout, JAPAN_MAP_COLS } from "@/components/organisms/japan-block-map-layout";

/** 実機で実際にある幅（小さい順）。iPhone SE(320) 〜 デスクトップ */
const WIDTHS = [320, 360, 375, 390, 414, 430, 480, 640, 768, 1024, 1280, 1920];

describe("computeMapLayout", () => {
  it("どの画面幅でも地図が利用可能幅に収まる（見切れない）", () => {
    for (const w of WIDTHS) {
      const { fitsWithin, mapWidth } = computeMapLayout(w);
      expect(fitsWithin, `width=${w} で収まらない (mapWidth=${mapWidth})`).toBe(true);
    }
  });

  it("地図の幅が画面幅を超えない", () => {
    for (const w of WIDTHS) {
      const { mapWidth } = computeMapLayout(w);
      expect(mapWidth, `width=${w}`).toBeLessThanOrEqual(w);
    }
  });

  it("スマホでもフォントが9px以上（読める下限）", () => {
    for (const w of WIDTHS) {
      const { fontSize } = computeMapLayout(w);
      expect(fontSize, `width=${w}`).toBeGreaterThanOrEqual(9);
    }
  });

  it("代表的なスマホ幅で 2文字が読めるサイズを確保する", () => {
    // 10px 以上 かつ 2文字表示。
    // ※以前は 11px 以上を要求していたが、それだと 375px で
    //   フォント11px × 2文字 + 余白4px = 26px > セル25px となり
    //   ellipsis が出て「北…」になっていた（省略記号を出さない方を優先する）。
    for (const w of [375, 390, 414]) {
      const { fontSize, maxChars } = computeMapLayout(w);
      expect(fontSize, `width=${w}`).toBeGreaterThanOrEqual(10);
      expect(maxChars, `width=${w}`).toBe(2);
    }
  });

  it("画面が広いほどセルは大きくなる（単調非減少）", () => {
    let prev = 0;
    for (const w of WIDTHS) {
      const { cellSize } = computeMapLayout(w);
      expect(cellSize, `width=${w} で縮んだ`).toBeGreaterThanOrEqual(prev);
      prev = cellSize;
    }
  });

  it("広い画面ではフルネーム表示に必要な42px以上のセルになる", () => {
    expect(computeMapLayout(768).cellSize).toBeGreaterThanOrEqual(42);
    expect(computeMapLayout(1280).cellSize).toBeGreaterThanOrEqual(42);
  });

  it("maxMapWidth を超えて広がらない", () => {
    const { mapWidth } = computeMapLayout(1920, 760);
    expect(mapWidth).toBeLessThanOrEqual(760);
  });

  it("異常な入力でも壊れない（0 や NaN は最小幅として扱う）", () => {
    for (const bad of [0, NaN, -100]) {
      const { cellSize, fitsWithin } = computeMapLayout(bad as number);
      expect(cellSize).toBeGreaterThan(0);
      expect(fitsWithin).toBe(true);
    }
  });

  it("列数は14（JAPAN_GRID と一致）", () => {
    expect(JAPAN_MAP_COLS).toBe(14);
  });

  /**
   * 省略記号(…)を出さないための検算。
   * 日本語は全角なので「文字数 × fontSize」がセルの内側(cellSize-4)に収まる必要がある。
   * 1px でも超えると text-overflow:ellipsis が発動し「北海」が「北…」になる
   * （2026-08-01、App Store 用スクショで発覚）。
   */
  it("表示文字数がセルに収まる（… にならない）", () => {
    for (const w of WIDTHS) {
      const { cellSize, fontSize, maxChars } = computeMapLayout(w);
      const needed = fontSize * maxChars + 4; // padding(1x2) + border(1x2)
      expect(
        needed,
        `width=${w}: cell=${cellSize} font=${fontSize} chars=${maxChars} → ${needed}px 必要`,
      ).toBeLessThanOrEqual(cellSize);
    }
  });

  it("実測幅でも … にならない", () => {
    for (const w of WIDTHS) {
      const { cellSize, fontSize, maxChars } = computeMapLayout(w, 760, true);
      expect(fontSize * maxChars + 4, `width=${w} (inset)`).toBeLessThanOrEqual(cellSize);
    }
  });

  it("広い画面ではフルネーム3文字を出す", () => {
    expect(computeMapLayout(768).maxChars).toBe(3);
    expect(computeMapLayout(1280).maxChars).toBe(3);
  });

  it("スマホでは最低2文字は出す（1文字だけの県名は分かりにくい）", () => {
    for (const w of [360, 375, 390, 414]) {
      expect(computeMapLayout(w).maxChars, `width=${w}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("実測幅を渡すとき(alreadyInset)は余白を二重に引かない", () => {
    // 実測コンテナ幅は既に親の padding が除かれているので、
    // 同じ数値でも alreadyInset の方が広く使える＝セルが小さくならない
    const win = computeMapLayout(375, 760, false);
    const measured = computeMapLayout(375, 760, true);
    expect(measured.cellSize).toBeGreaterThanOrEqual(win.cellSize);
    expect(measured.fitsWithin).toBe(true);
  });

  it("実測幅でもどの幅で収まる", () => {
    for (const w of WIDTHS) {
      const { fitsWithin, mapWidth } = computeMapLayout(w, 760, true);
      expect(fitsWithin, `width=${w} (inset) で収まらない`).toBe(true);
      expect(mapWidth).toBeLessThanOrEqual(Math.max(w, 320));
    }
  });
});
