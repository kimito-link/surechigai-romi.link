/**
 * lib/nearby-presence.ts — 「みんなの居場所」の並べ替え・距離表示（純関数）。
 *
 * presence.list（5分以内に位置を出している人）を、見ている人の現在地から近い順に並べる。
 * 座標はサーバーが返した正確な値をそのまま使う（ぼかし・丸めはしない。CLAUDE.md 設計原則1）。
 */

/**
 * 2点間の距離（m）。lib/get-current-location の haversineMeters と同じ式。
 * あちらは react-native を読むのでテストから使えず、こちらは依存ゼロにしておく。
 */
function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 徒歩の速さ（不動産広告の基準と同じ 80m/分） */
export const WALK_METERS_PER_MINUTE = 80;

export type NearbyRangeKey = "walk5" | "walk15" | "km5" | "all";

export type NearbyRange = {
  key: NearbyRangeKey;
  label: string;
  /** null は「ぜんぶ」（距離で絞らない） */
  meters: number | null;
};

export const NEARBY_RANGES: readonly NearbyRange[] = [
  { key: "walk5", label: "徒歩5分", meters: 5 * WALK_METERS_PER_MINUTE },
  { key: "walk15", label: "徒歩15分", meters: 15 * WALK_METERS_PER_MINUTE },
  { key: "km5", label: "5km", meters: 5_000 },
  { key: "all", label: "ぜんぶ", meters: null },
] as const;

export function getNearbyRange(key: NearbyRangeKey): NearbyRange {
  return NEARBY_RANGES.find((r) => r.key === key) ?? NEARBY_RANGES[NEARBY_RANGES.length - 1];
}

/** 次に広い範囲（「もう少し広く見る」ボタン用）。いちばん広いときは null */
export function widerRange(key: NearbyRangeKey): NearbyRange | null {
  const i = NEARBY_RANGES.findIndex((r) => r.key === key);
  return i >= 0 && i < NEARBY_RANGES.length - 1 ? NEARBY_RANGES[i + 1] : null;
}

export type NearbyPerson<T> = T & {
  /** 見ている人からの距離（現在地が分からないときは null） */
  distanceM: number | null;
};

/**
 * 自分以外を近い順に並べる。現在地が分からないときは更新が新しい順。
 */
export function sortByDistance<T extends { lat: number; lng: number; isSelf: boolean; updatedAt: string }>(
  people: readonly T[],
  origin: { lat: number; lng: number } | null,
): NearbyPerson<T>[] {
  const withDistance = people
    .filter((p) => !p.isSelf && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({ ...p, distanceM: origin ? haversineMeters(origin, p) : null }));

  return withDistance.sort((a, b) => {
    if (a.distanceM != null && b.distanceM != null) return a.distanceM - b.distanceM;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function filterByRange<T extends { distanceM: number | null }>(
  people: readonly T[],
  range: NearbyRange,
): T[] {
  if (range.meters == null) return [...people];
  return people.filter((p) => p.distanceM != null && p.distanceM <= range.meters!);
}

/** 「徒歩7分・560m」「12.3km」のような表示 */
export function formatDistance(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return "距離不明";
  if (meters < 2_000) {
    const minutes = Math.max(1, Math.ceil(meters / WALK_METERS_PER_MINUTE));
    return `徒歩${minutes}分・${Math.round(meters)}m`;
  }
  if (meters < 100_000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters / 1000)}km`;
}

/** 「たった今」「3分前」 */
export function formatAgo(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const minutes = Math.floor((now - t) / 60_000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  return `${Math.floor(minutes / 60)}時間前`;
}

/** 右上の「21:45 時点」 */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

/**
 * りんく・こん太のひとこと。人数と範囲で変える（参考: 近くの乗りもの）。
 */
export function characterLines(
  countInRange: number,
  countAll: number,
  range: NearbyRange,
  hasOrigin: boolean,
): { rinku: string; konta: string } {
  if (!hasOrigin) {
    return {
      rinku: "現在地がわからないから、新しい順に並べたよ",
      konta: "位置情報を許可すると近い順になるよ",
    };
  }
  if (countAll === 0) {
    return {
      rinku: "いまは誰も地図に出てないみたい…",
      konta: "居場所を出した人は5分だけここに映るよ",
    };
  }
  if (countInRange === 0) {
    return {
      rinku: `${range.label}以内にはいないみたい…`,
      konta: "少し広げると見つかるかも",
    };
  }
  return {
    rinku: `${range.meters == null ? "" : `${range.label}以内に`}${countInRange}人いるよ！`,
    konta: "ピンを押すと、その人の場所がわかるよ",
  };
}
