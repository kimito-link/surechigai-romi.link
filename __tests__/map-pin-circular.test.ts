/**
 * 地図の現在地ピンが「真円」であることを守る。
 *
 * ★2026-08-20 実機report: 丸い枠の中に四角いアイコンが入って見えていた。
 *   borderRadius が markerSize * 0.2（外）/ (markerSize-6) * 0.16（内）で、
 *   どちらも「角丸の四角」だった。外だけ丸めても中身が四角なら意味がない。
 *
 * とまり木(tomarigi.me)のように「丸＝その人のサムネ」に見せる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(__dirname, "../components/organisms/precision-tile-map.tsx"),
  "utf8",
);

describe("地図の現在地ピン", () => {
  it("外側が真円（markerSize / 2）", () => {
    expect(SRC).toMatch(/borderRadius:\s*markerSize\s*\/\s*2/);
  });

  it("内側の画像も真円に切る", () => {
    expect(SRC).toMatch(/borderRadius:\s*\(markerSize\s*-\s*6\)\s*\/\s*2/);
  });

  it("角丸の四角に戻されていない", () => {
    // 0.2 / 0.16 のような係数は「角丸の四角」になる
    expect(SRC).not.toMatch(/borderRadius:\s*markerSize\s*\*\s*0\./);
    expect(SRC).not.toMatch(/borderRadius:\s*\(markerSize\s*-\s*6\)\s*\*\s*0\./);
  });

  it("画像が枠いっぱいに収まる（cover）", () => {
    // contain だと余白が出て「丸の中に四角」に見える
    expect(SRC).toMatch(/resizeMode="cover"/);
  });
});
