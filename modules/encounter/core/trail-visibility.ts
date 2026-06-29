/**
 * 軌跡の公開範囲（trailVisibility）判定。
 * DB・HTTP 非依存の純関数。
 */

export const TRAIL_VISIBILITY_VALUES = [
  "private",
  "link",
  "acquaintance",
  "public",
] as const;

export type TrailVisibility = (typeof TRAIL_VISIBILITY_VALUES)[number];

export function parseTrailVisibility(
  value: string | null | undefined,
): TrailVisibility {
  if (
    value === "private" ||
    value === "link" ||
    value === "acquaintance" ||
    value === "public"
  ) {
    return value;
  }
  return "public";
}

export function trailVisibilityLabel(value: TrailVisibility): string {
  switch (value) {
    case "private":
      return "非公開（自分だけ）";
    case "link":
      return "リンクを知っている人";
    case "acquaintance":
      return "すれ違った人だけ";
    case "public":
      return "公開（都道府県一覧にも表示）";
  }
}

export function trailVisibilityDescription(value: TrailVisibility): string {
  switch (value) {
    case "private":
      return "記録は残りますが、県別一覧や共有リンクからは見えません";
    case "link":
      return "/u/リンクを知っている人だけが軌跡を閲覧できます";
    case "acquaintance":
      return "すれ違いが記録された人だけが軌跡を閲覧できます";
    case "public":
      return "都道府県別クリエイター一覧にも載り、リンクからも閲覧できます";
  }
}

/** 都道府県別クリエイター一覧に載せるか */
export function isListedInPrefectureDirectory(
  visibility: TrailVisibility,
): boolean {
  return visibility === "public";
}

export type TrailAccessInput = {
  visibility: TrailVisibility;
  ownerUserId: number;
  viewerUserId: number | null | undefined;
  hasEncounter: boolean;
};

/**
 * /u/<slug> や OGP で軌跡を見せてよいか。
 * acquaintance は hasEncounter を事前に DB で解決して渡す。
 */
export function canViewTrail(input: TrailAccessInput): boolean {
  const viewer = input.viewerUserId ?? null;
  if (viewer === input.ownerUserId) return true;
  if (input.visibility === "private") return false;
  if (input.visibility === "public" || input.visibility === "link") return true;
  if (input.visibility === "acquaintance") return input.hasEncounter;
  return false;
}
