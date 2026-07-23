/**
 * modules/encounter/core/geo.ts
 *
 * 位置情報の座標・グリッド・H3 を扱う共通ヘルパー。
 * DB・認証・Express に非依存の純粋TS。
 *
 * 移植元: surechigai-nico/server/src/lib/locationGeom.ts
 */

import { latLngToCell, gridDisk, cellToParent } from "h3-js";

// ---------------------------------------------------------------------------
// グリッド定数
// ---------------------------------------------------------------------------

/** グリッド1セルの緯度方向ステップ（約 500m 相当） */
export const LAT_GRID = 0.0045;
/** グリッド1セルの経度方向ステップ（日本の緯度35度付近で約 500m 相当） */
export const LNG_GRID = 0.0055;

/** H3 解像度 8（エッジ長 ~0.53km 実測）。チェックイン・即時マッチング用 */
export const H3_RES_8 = 8;
/** H3 解像度 7（エッジ長 ~1.41km 実測）。visitedAreas・タイムシフト用 */
export const H3_RES_7 = 7;
/** H3 解像度 5（エッジ長 ~9.85km 実測）。Tier3-4 広域候補の locations.h3R5 用 */
export const H3_RES_5 = 5;

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

export type GridValues = {
  latGrid: number;
  lngGrid: number;
};

export type LatLng = {
  lat: number;
  lng: number;
};

// ---------------------------------------------------------------------------
// 関数
// ---------------------------------------------------------------------------

/**
 * 500m グリッドにスナップする（Math.floor ベース）。
 */
export function toGrid(lat: number, lng: number): GridValues {
  return {
    latGrid: Math.floor(lat / LAT_GRID) * LAT_GRID,
    lngGrid: Math.floor(lng / LNG_GRID) * LNG_GRID,
  };
}

/**
 * 緯度経度 → H3 セル文字列（デフォルト res 8）。
 */
export function toH3Cell(lat: number, lng: number, res = H3_RES_8): string {
  return latLngToCell(lat, lng, res);
}

/**
 * 緯度経度 → H3 res 7 セル。visitedAreas / タイムシフト用。
 */
export function toH3R7(lat: number, lng: number): string {
  return latLngToCell(lat, lng, H3_RES_7);
}

/**
 * H3 セルとその k-ring 近傍セルのリストを返す。
 */
export function kRing(cell: string, k: number): string[] {
  return gridDisk(cell, k);
}

/**
 * H3 res8 セルから、より粗い解像度の親セルを導出する。
 * locations.h3R7 / h3R5 の書き込み用（cellToParent は直接 latLngToCell するより
 * 常に h3R8 セルとの階層一貫性が保たれるため、こちらを使う）。
 *
 * 注意: 同じ座標を直接 latLngToCell(lat, lng, res) で計算した値とは、
 * h3-js の階層非整合性により一致しないことがある（実測確認済み）。
 * visitedAreas.h3R7（直接計算・タイムシフト専用）とは目的も導出方法も異なる。
 */
export function toH3ParentCell(h3R8Cell: string, res: number): string {
  return cellToParent(h3R8Cell, res);
}

/**
 * Haversine 公式で2点間の距離（メートル）を返す。
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * lat/lng が有限な実数かどうかを検証して返す。
 * NaN / Infinity / 非 number の場合は null。
 */
export function assertFiniteLatLng(
  lat: unknown,
  lng: unknown
): LatLng | null {
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return { lat, lng };
  }
  return null;
}
