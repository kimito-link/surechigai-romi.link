/**
 * modules/encounter/core/tiers.ts
 *
 * ティア定義（1:500m / 2:3km / 3:10km / 4:50km / 5:タイムシフト）と判定関数。
 * DB・認証・Express に非依存の純粋TS。
 *
 * 移植元: surechigai-nico/server/src/cron/matcher.ts TIERS 定義
 */

// ---------------------------------------------------------------------------
// ティア定義
// ---------------------------------------------------------------------------

export const TIER_DEFS = [
  { tier: 1 as const, radiusM: 500,    label: "すれ違い",   h3Res: 8, k: 1 },
  { tier: 2 as const, radiusM: 3_000,  label: "ご近所",     h3Res: 7, k: 2 },
  { tier: 3 as const, radiusM: 10_000, label: "同じ街",     h3Res: 6, k: 2 },
  { tier: 4 as const, radiusM: 50_000, label: "同じ地域",   h3Res: 5, k: 3 },
  // ティア5はタイムシフト（visitedAreas 同セル）。距離閾値なし。
] as const;

export type TierNumber = 1 | 2 | 3 | 4 | 5;

export type TierDef = (typeof TIER_DEFS)[number];

export const TIER_5_TIMESHIFT = {
  tier: 5 as const,
  label: "タイムシフト",
} as const;

// ---------------------------------------------------------------------------
// 判定関数
// ---------------------------------------------------------------------------

/**
 * 距離（メートル）からティア番号を返す。
 * 距離が 50km 超の場合は null（マッチしない）。
 * タイムシフト（ティア5）は距離判定を行わないため、この関数では扱わない。
 */
export function judgeTier(distanceMeters: number): TierNumber | null {
  if (distanceMeters <= 500)    return 1;
  if (distanceMeters <= 3_000)  return 2;
  if (distanceMeters <= 10_000) return 3;
  if (distanceMeters <= 50_000) return 4;
  return null;
}

/**
 * ティア番号からラベル文字列を返す。
 */
export function tierLabel(tier: TierNumber): string {
  if (tier === 5) return TIER_5_TIMESHIFT.label;
  const def = TIER_DEFS.find((d) => d.tier === tier);
  return def?.label ?? `ティア${tier}`;
}
