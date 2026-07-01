/**
 * 自宅マスク（homeMaskCell）推定。
 * 昼間の旅行先チェックインを「自宅」と誤判定しないため、夜間帯のみ集計する。
 */

/** 夜間帯（JST）: 23:00〜05:59 */
export const HOME_MASK_NIGHT_HOURS_JST = { start: 23, end: 5 } as const;

/** 自宅候補として採用する最低夜間チェックイン回数 */
export const HOME_MASK_MIN_NIGHT_VISITS = 3;

export function isNightHourJst(hour: number): boolean {
  return hour >= HOME_MASK_NIGHT_HOURS_JST.start || hour <= HOME_MASK_NIGHT_HOURS_JST.end;
}
