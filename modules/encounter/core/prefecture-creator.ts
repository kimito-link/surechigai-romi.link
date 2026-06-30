/**
 * 都道府県クリエイター一覧の UI 向け純粋ロジック（Metro / クライアント用 @/ import）。
 * サーバー行組み立ては prefecture-creator-row.ts を参照。
 */

import { formatKimitoLinkLabel } from "../../../lib/kimito-link-urls.js";
import { isValidShareSlug } from "../../../lib/twitter-username.js";
import type { CreatorLinkInput } from "./prefecture-creator-types";

export type {
  CreatorLinkInput,
  PrefectureCreatorRow,
  PrefectureCreatorUserInput,
  TwitterCacheInfo,
  TwitterFollowInfo,
} from "./prefecture-creator-types";

export function formatCreatorAccountId(username: string | null): string {
  if (!username) return "—";
  return `@${username.replace(/^@/, "")}`;
}

export function formatCreatorDisplayName(
  displayName: string | null,
  username: string | null,
): string {
  return displayName || username || "名無し";
}

export function formatFollowersCount(count: number | null | undefined): string {
  if (typeof count !== "number" || !Number.isFinite(count)) return "—";
  return count.toLocaleString("ja-JP");
}

export function resolveCreatorLinkVisibility(input: CreatorLinkInput): {
  showKimitoLink: boolean;
  showShareMap: boolean;
  kimitoLabel: string | null;
} {
  const kimitoLabel = input.username ? formatKimitoLinkLabel(input.username) : null;
  const validSlug = isValidShareSlug(input.shareSlug) ? input.shareSlug : null;
  return {
    showKimitoLink: Boolean(input.kimitoLinkUrl && kimitoLabel),
    showShareMap: Boolean(validSlug && input.shareUrl),
    kimitoLabel,
  };
}
