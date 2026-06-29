/**
 * 逆ジオコーディング結果からイベント会場ラベル（venueName）を組み立てる。
 */
import type { GeocodeResult } from "../../encounter/core/geocoding.js";

export function venueLabelFromGeocode(geo: GeocodeResult): string {
  const parts: string[] = [];
  if (geo.municipality) parts.push(geo.municipality);
  if (
    geo.areaName &&
    geo.areaName !== "不明なエリア" &&
    !parts.some((p) => geo.areaName!.includes(p) || p.includes(geo.areaName!))
  ) {
    parts.push(geo.areaName);
  }
  if (parts.length > 0) return parts.join(" ").slice(0, 120);

  if (geo.address) {
    const first = geo.address.split(",")[0]?.trim();
    if (first) return first.slice(0, 120);
  }
  return "";
}
