/** OSM タイル地図の純関数（PrecisionTileMap 本体を import せず使える軽量モジュール）。 */

export const TILE_SIZE = 256;
export const MAX_TILE_LAT = 85.05112878;

export type TrailPoint = {
  id: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  municipality: string | null;
  prefecture: string | null;
  address: string | null;
  recordedAt: Date | string;
  visibility?: string | null;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 複数の点がすべて収まる中心座標とズームを算出。
 */
export function fitCenterZoom(
  points: { lat: number; lng: number }[],
  mapW: number,
  mapH: number,
): { center: { lat: number; lng: number }; zoom: number } {
  if (points.length === 0) {
    return { center: { lat: 36.2048, lng: 138.2529 }, zoom: 5 };
  }
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  if (points.length === 1) return { center, zoom: 14 };

  const mercY = (l: number) => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI / 180) / 2));
  const worldLng = Math.max((maxLng - minLng) / 360, 1e-6);
  const worldLat = Math.max((mercY(maxLat) - mercY(minLat)) / (2 * Math.PI), 1e-6);
  const zoomLng = Math.log2(mapW / (TILE_SIZE * worldLng));
  const zoomLat = Math.log2(mapH / (TILE_SIZE * worldLat));
  const zoom = Math.floor(Math.min(zoomLng, zoomLat)) - 1;
  return { center, zoom: clamp(zoom, 5, 16) };
}
