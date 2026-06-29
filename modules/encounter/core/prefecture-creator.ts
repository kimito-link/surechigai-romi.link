/**
 * 都道府県クリエイター一覧の純粋ロジック。
 * DB クエリ (queries.ts) と UI から共有。テスト駆動で kimito.link 主リンクを保証する。
 */

import {
  buildKimitoPublicProfileUrl,
  buildSurechigaiShareUrl,
  formatKimitoLinkLabel,
} from "../../../lib/kimito-link-urls.js";

export type PrefectureCreatorRow = {
  userId: number;
  displayName: string | null;
  username: string | null;
  twitterId: string | null;
  profileImage: string | null;
  followersCount: number | null;
  /** kimito.link 公開ページ（主リンク） */
  kimitoLinkUrl: string | null;
  shareSlug: string | null;
  /** surechigai 共有地図（副リンク） */
  shareUrl: string | null;
  lastStayedAt: Date;
};

export type TwitterCacheInfo = {
  twitterUsername: string;
  twitterId: string | null;
  displayName: string | null;
  profileImage: string | null;
  followersCount: number | null;
};

export type TwitterFollowInfo = {
  twitterUsername: string | null;
  twitterId: string | null;
};

export type PrefectureCreatorUserInput = {
  userId: number;
  name: string | null;
  openId: string;
  shareSlug: string | null;
  lastStayedAt: Date | null;
};

export function extractTwitterIdFromOpenId(openId: string): string | null {
  const m = /^twitter:(.+)$/.exec(openId);
  return m?.[1] ?? null;
}

export function resolveTwitterCacheForUser(
  user: { id: number; openId: string; name: string | null },
  followByUserId: Map<number, TwitterFollowInfo>,
  cacheByTwitterId: Map<string, TwitterCacheInfo>,
  cacheByUsername: Map<string, TwitterCacheInfo>,
): TwitterCacheInfo | undefined {
  const twitterId = extractTwitterIdFromOpenId(user.openId);
  if (twitterId) {
    const byId = cacheByTwitterId.get(twitterId);
    if (byId) return byId;
  }

  const follow = followByUserId.get(user.id);
  if (follow?.twitterId) {
    const byFollowId = cacheByTwitterId.get(follow.twitterId);
    if (byFollowId) return byFollowId;
  }
  if (follow?.twitterUsername) {
    const byFollowName = cacheByUsername.get(follow.twitterUsername.toLowerCase());
    if (byFollowName) return byFollowName;
  }

  const nameCandidate = (user.name ?? "").replace(/^@/, "").trim();
  if (nameCandidate && !nameCandidate.includes(" ") && nameCandidate.length <= 50) {
    return cacheByUsername.get(nameCandidate.toLowerCase());
  }

  return undefined;
}

/** 1 ユーザーの都道府県クリエイター行を組み立てる。lastStayedAt 無しは null。 */
export function buildPrefectureCreatorRow(
  user: PrefectureCreatorUserInput,
  follow: TwitterFollowInfo | undefined,
  cached: TwitterCacheInfo | undefined,
): PrefectureCreatorRow | null {
  if (!user.lastStayedAt) return null;

  const twitterId =
    extractTwitterIdFromOpenId(user.openId) ?? cached?.twitterId ?? follow?.twitterId ?? null;
  const username = cached?.twitterUsername ?? follow?.twitterUsername ?? null;
  const kimitoLinkUrl = username ? buildKimitoPublicProfileUrl(username) : null;
  const shareUrl = user.shareSlug ? buildSurechigaiShareUrl(user.shareSlug) : null;

  return {
    userId: user.userId,
    displayName: cached?.displayName ?? user.name,
    username,
    twitterId,
    profileImage: cached?.profileImage ?? null,
    followersCount: cached?.followersCount ?? null,
    kimitoLinkUrl,
    shareSlug: user.shareSlug,
    shareUrl,
    lastStayedAt: user.lastStayedAt,
  };
}

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

export type CreatorLinkInput = {
  username: string | null;
  kimitoLinkUrl: string | null;
  shareSlug: string | null;
  shareUrl: string | null;
};

export function resolveCreatorLinkVisibility(input: CreatorLinkInput): {
  showKimitoLink: boolean;
  showShareMap: boolean;
  kimitoLabel: string | null;
} {
  const kimitoLabel = input.username ? formatKimitoLinkLabel(input.username) : null;
  return {
    showKimitoLink: Boolean(input.kimitoLinkUrl && kimitoLabel),
    showShareMap: Boolean(input.shareSlug || input.shareUrl),
    kimitoLabel,
  };
}
