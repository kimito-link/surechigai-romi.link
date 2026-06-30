/**
 * 保存済み足あとの座標から外部マップ（Google / Apple）の車ルートを開く。
 * SNS 用 openExternalUrl とは分離し、固定テンプレート URL のみ生成する。
 */

import { Linking, Platform } from "react-native";
import { assertFiniteLatLng, type LatLng } from "@/modules/encounter/core/geo";

export type MapsTravelMode = "driving" | "walking" | "transit";

export type MapsDirectionsParams = LatLng & {
  travelMode?: MapsTravelMode;
  label?: string;
};

const GOOGLE_TRAVEL_MODE: Record<MapsTravelMode, string> = {
  driving: "driving",
  walking: "walking",
  transit: "transit",
};

const APPLE_DIR_FLAG: Record<MapsTravelMode, string> = {
  driving: "d",
  walking: "w",
  transit: "r",
};

function normalizeCoord(value: number): string {
  return value.toFixed(6);
}

function parseCoords(lat: unknown, lng: unknown): LatLng | null {
  const parsed = assertFiniteLatLng(lat, lng);
  if (!parsed) return null;
  if (parsed.lat < -90 || parsed.lat > 90) return null;
  if (parsed.lng < -180 || parsed.lng > 180) return null;
  return parsed;
}

export function buildGoogleMapsDirectionsUrl(
  params: MapsDirectionsParams,
): string | null {
  const coords = parseCoords(params.lat, params.lng);
  if (!coords) return null;

  const travelMode = params.travelMode ?? "driving";
  const destination = `${normalizeCoord(coords.lat)},${normalizeCoord(coords.lng)}`;
  const search = new URLSearchParams({
    api: "1",
    destination,
    travelmode: GOOGLE_TRAVEL_MODE[travelMode],
  });
  return `https://www.google.com/maps/dir/?${search.toString()}`;
}

export function buildAppleMapsDirectionsUrl(
  params: MapsDirectionsParams,
): string | null {
  const coords = parseCoords(params.lat, params.lng);
  if (!coords) return null;

  const travelMode = params.travelMode ?? "driving";
  const search = new URLSearchParams({
    daddr: `${normalizeCoord(coords.lat)},${normalizeCoord(coords.lng)}`,
    dirflg: APPLE_DIR_FLAG[travelMode],
  });
  return `https://maps.apple.com/?${search.toString()}`;
}

function pickMapsUrl(params: MapsDirectionsParams): string | null {
  if (Platform.OS === "ios") {
    return buildAppleMapsDirectionsUrl(params) ?? buildGoogleMapsDirectionsUrl(params);
  }
  return buildGoogleMapsDirectionsUrl(params);
}

/**
 * 外部マップアプリで車ルート（デフォルト）を開く。
 */
export async function openMapsDirections(params: MapsDirectionsParams): Promise<boolean> {
  const url = pickMapsUrl(params);
  if (!url) {
    console.warn("[Navigation] Invalid coordinates for maps directions", params);
    return false;
  }

  try {
    if (Platform.OS === "web") {
      window.open(url, "_blank", "noopener,noreferrer");
      console.log(`[Navigation] Opened maps directions (web): ${url}`);
      return true;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      console.warn(`[Navigation] Cannot open maps URL: ${url}`);
      return false;
    }

    await Linking.openURL(url);
    console.log(`[Navigation] Opened maps directions (native): ${url}`);
    return true;
  } catch (error) {
    console.error(`[Navigation] Failed to open maps directions: ${url}`, error);
    return false;
  }
}
