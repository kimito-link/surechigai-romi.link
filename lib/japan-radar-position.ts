/**
 * 緯度経度 → 日本レーダー地図上の % 座標（CharacterHere / EnvelopePulse と同系）。
 * 既知の表示位置（小樽・博多・松山）から逆算した近似。
 */

const LNG_MIN = 129.47;
const LNG_RANGE = 15.59;
const LAT_MAX = 44.66;
const LAT_RANGE = 12.15;

export type RadarPercent = { x: number; y: number };

export function latLngToRadarPercent(
  lat: number,
  lng: number,
): RadarPercent | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const x = ((lng - LNG_MIN) / LNG_RANGE) * 100;
  const y = ((LAT_MAX - lat) / LAT_RANGE) * 100;

  return {
    x: Math.min(95, Math.max(5, x)),
    y: Math.min(95, Math.max(5, y)),
  };
}
