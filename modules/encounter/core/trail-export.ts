/**
 * modules/encounter/core/trail-export.ts
 *
 * 足あとを GPX / GeoJSON に書き出す純粋関数（プレミアム機能）。
 *
 * 「正確な座標を永続保存する」というアプリの核と最も響き合う特典なので、
 * 丸めた座標ではなく保存されている実座標をそのまま出す。
 */

export type ExportableTrailPoint = {
  lat: number;
  lng: number;
  recordedAt: Date | string;
  municipality?: string | null;
  prefecture?: string | null;
  address?: string | null;
  placeName?: string | null;
  note?: string | null;
};

/** XML のテキストノード用エスケープ */
function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIso(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** 地点の見出し。本人が付けた名前があればそれを優先する */
function pointName(p: ExportableTrailPoint): string {
  return (
    p.placeName?.trim() ||
    p.address?.trim() ||
    [p.prefecture, p.municipality].filter(Boolean).join(" ") ||
    "足あと"
  );
}

/** GPX 1.1。ヤマレコ・Garmin 等の一般的なツールで開ける形式 */
export function buildTrailGpx(points: ExportableTrailPoint[]): string {
  const waypoints = points
    .map((p) => {
      const time = toIso(p.recordedAt);
      const desc = p.note?.trim();
      return [
        `  <wpt lat="${p.lat}" lon="${p.lng}">`,
        `    <name>${escXml(pointName(p))}</name>`,
        desc ? `    <desc>${escXml(desc)}</desc>` : null,
        time ? `    <time>${time}</time>` : null,
        `  </wpt>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="surechigai-romi" xmlns="http://www.topografix.com/GPX/1/1">',
    "  <metadata>",
    "    <name>君斗りんくのすれ違ひ通信 — 足あと</name>",
    "  </metadata>",
    waypoints,
    "</gpx>",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** GeoJSON FeatureCollection。地図ツール全般で開ける */
export function buildTrailGeoJson(points: ExportableTrailPoint[]): string {
  const features = points.map((p) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      // GeoJSON は [経度, 緯度] の順（緯度経度の逆）
      coordinates: [p.lng, p.lat],
    },
    properties: {
      name: pointName(p),
      recordedAt: toIso(p.recordedAt),
      prefecture: p.prefecture ?? null,
      municipality: p.municipality ?? null,
      address: p.address ?? null,
      placeName: p.placeName ?? null,
      note: p.note ?? null,
    },
  }));

  return JSON.stringify(
    { type: "FeatureCollection", features },
    null,
    2,
  );
}
