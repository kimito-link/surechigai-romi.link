/**
 * Google Maps URL / 緯度経度文字列から座標を抽出する。
 * visit.tsx 由来。クライアント・サーバー両方で使える純関数。
 */

export type ParsedCoordinate = {
  lat: number;
  lng: number;
};

const COORDINATE_NUMBER_RE = "([+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+))";

function parseCoordinateMatch(match: RegExpMatchArray | null): ParsedCoordinate | null {
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function safeDecodeInput(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

/** Maps 共有 URL・@lat,lng・"35.68, 139.76" 形式を解析する。 */
export function parseCoordinateInput(input: string): ParsedCoordinate | null {
  const source = safeDecodeInput(input.trim()).replace(/\+/g, " ");
  if (!source) return null;

  const coordinatePair = `${COORDINATE_NUMBER_RE}\\s*,\\s*${COORDINATE_NUMBER_RE}`;
  const fromAtMarker = parseCoordinateMatch(source.match(new RegExp(`@${coordinatePair}`)));
  if (fromAtMarker) return fromAtMarker;

  const fromQuery = parseCoordinateMatch(
    source.match(new RegExp(`[?&](?:q|query|ll)=${coordinatePair}`)),
  );
  if (fromQuery) return fromQuery;

  return parseCoordinateMatch(source.match(new RegExp(coordinatePair)));
}

export function formatCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
