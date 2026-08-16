/**
 * modules/encounter/core/lat-lng.ts
 *
 * 座標の型と検証だけを持つ、依存ゼロのモジュール。
 *
 * ★2026-08-16 に geo.ts から切り出した理由:
 * クライアント（lib/navigation/open-maps-directions.ts）が
 * `assertFiniteLatLng` **1関数のためだけに** geo.ts を import しており、
 * geo.ts が `h3-js` を import しているせいで **h3-js 全体がWebバンドルに載っていた**。
 * ゲストのトップページは地理計算を一切しないのに、起動時に読まされていた
 * （Lighthouse: unused-javascript 602KiB / LCP 13.8s の一因）。
 *
 * ここには h3-js を含む重い依存を **絶対に import しない**。
 * セル計算など h3 が要るものは geo.ts に置くこと。
 */

export type LatLng = {
  lat: number;
  lng: number;
};

/**
 * lat/lng が有限な実数かどうかを検証して返す。
 * NaN / Infinity / 非 number の場合は null。
 */
export function assertFiniteLatLng(lat: unknown, lng: unknown): LatLng | null {
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
