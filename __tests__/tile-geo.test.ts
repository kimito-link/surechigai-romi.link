import { describe, expect, it } from "vitest";
import {
  fitCenterZoom,
  clamp,
  TILE_SIZE,
  pixelToLatLng,
  resolvePressPoint,
} from "@/lib/map/tile-geo";
import { assertFiniteLatLng } from "@/modules/encounter/core/lat-lng";

describe("tile-geo", () => {
  it("fitCenterZoom は0件で日本全体", () => {
    const result = fitCenterZoom([], 400, 300);
    expect(result.zoom).toBe(5);
    expect(result.center.lat).toBeCloseTo(36.2048);
  });

  it("clamp が範囲内に収める", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("TILE_SIZE は 256", () => {
    expect(TILE_SIZE).toBe(256);
  });
});

/**
 * ★本番のチェックインで実際に起きていた不具合の再発防止（2026-09-01）。
 *
 *   PC ブラウザで「地図をクリックして位置を修正」→ 保存すると赤いエラー:
 *     "Invalid input: expected number, received NaN"（path: lat / lng）
 *
 *   ★真因: react-native-web の Pressable.onPress は素の DOM MouseEvent を渡すため
 *   locationX / locationY が undefined。それが無検査で pixelToLatLng に入り、
 *   undefined + number = NaN が全式に伝播していた。
 */
describe("★地図クリックの NaN（本番で発生した不具合）", () => {
  const topLeft = { x: 3_722_000, y: 1_650_000 };

  it("★clamp は NaN を止めない（「clamp が守ってくれる」という誤解の再発防止）", () => {
    // ★Math.min(Math.max(NaN, min), max) は NaN。範囲に丸めてくれると思うと必ず間違える。
    expect(Number.isNaN(clamp(NaN, -85, 85))).toBe(true);
  });

  it("★locationX/Y が無いと pixelToLatLng は NaN を返す（現状の記録）", () => {
    // ★本番で起きていたのは「両方 undefined」（onPress の分割代入が両方外す）。
    const both = pixelToLatLng(
      undefined as unknown as number,
      undefined as unknown as number,
      topLeft,
      17,
    );
    expect(Number.isFinite(both.lat)).toBe(false);
    expect(Number.isFinite(both.lng)).toBe(false);

    // ★片方だけ欠けると、欠けた軸だけが NaN になる。
    //   lat は y から、lng は x から計算されるので**軸が入れ替わって効く**。
    //   ここを取り違えると「lat は無事だから大丈夫」と誤読する。
    const onlyX = pixelToLatLng(undefined as unknown as number, 100, topLeft, 17);
    expect(Number.isFinite(onlyX.lng)).toBe(false);
    expect(Number.isFinite(onlyX.lat)).toBe(true);
  });

  it("ネイティブの形（locationX がある）はそのまま使う", () => {
    expect(resolvePressPoint({ locationX: 120, locationY: 80 }, { left: 380, top: 220 }))
      .toEqual({ x: 120, y: 80 });
  });

  it("★Webの形（locationX が無く clientX がある）で正しい座標に直す ← 本番で壊れていたケース", () => {
    expect(
      resolvePressPoint(
        { locationX: undefined, locationY: undefined, clientX: 500, clientY: 300 },
        { left: 380, top: 220 },
      ),
    ).toEqual({ x: 120, y: 80 });
  });

  it("スマホWebのタッチ（changedTouches）からも座標を出せる", () => {
    expect(
      resolvePressPoint(
        { changedTouches: [{ clientX: 500, clientY: 300 }] },
        { left: 380, top: 220 },
      ),
    ).toEqual({ x: 120, y: 80 });
  });

  it("★どちらでも決められなければ null（NaN を先へ流さない）", () => {
    expect(resolvePressPoint({ clientX: 500, clientY: 300 }, null)).toBeNull();
    expect(resolvePressPoint({}, { left: 0, top: 0 })).toBeNull();
    expect(resolvePressPoint(null, null)).toBeNull();
  });

  it("★解決した座標を通せば pixelToLatLng は実数を返す（直った状態の固定）", () => {
    const point = resolvePressPoint(
      { clientX: 500, clientY: 300 },
      { left: 380, top: 220 },
    );
    expect(point).not.toBeNull();
    const coords = pixelToLatLng(point!.x, point!.y, topLeft, 17);
    expect(Number.isFinite(coords.lat)).toBe(true);
    expect(Number.isFinite(coords.lng)).toBe(true);
  });

  it("★NaN 座標は既存の正本ガードで捨てられる（送信まで行かない）", () => {
    // ★確定済みの座標に見えても {lat: NaN} は truthy なので `if (!coords)` では止まらない。
    const nan = { lat: NaN, lng: NaN };
    expect(Boolean(nan)).toBe(true); // ← これが素通りの原因だった
    expect(assertFiniteLatLng(nan.lat, nan.lng)).toBeNull();
  });
});
