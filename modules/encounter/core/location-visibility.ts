/**
 * 足あと1件ごとの公開/非公開（locations.visibility）。
 * グローバル trailVisibility とは別に、個別地点だけ非公開にできる。
 */

export const LOCATION_VISIBILITY_VALUES = ["public", "private"] as const;

export type LocationVisibility = (typeof LOCATION_VISIBILITY_VALUES)[number];

export function parseLocationVisibility(
  value: string | null | undefined,
): LocationVisibility {
  return value === "private" ? "private" : "public";
}

export function locationVisibilityLabel(value: LocationVisibility): string {
  return value === "public" ? "公開" : "非公開";
}

export function toggleLocationVisibility(
  value: LocationVisibility,
): LocationVisibility {
  return value === "public" ? "private" : "public";
}

/** 共有リンク・県別一覧に載せるか（本人の地図/図鑑には常に表示） */
export function isLocationVisibleToOthers(
  value: string | null | undefined,
): boolean {
  return parseLocationVisibility(value) === "public";
}

/** 自宅マスクセルは第三者向けシェアのみ除外（本人の明示シェアは最新公開地点を優先） */
export function shouldMaskHomeCellFromShare(
  homeMaskCell: string | null | undefined,
  viewerUserId: number | null | undefined,
  ownerUserId: number,
): boolean {
  return !!homeMaskCell && viewerUserId !== ownerUserId;
}
