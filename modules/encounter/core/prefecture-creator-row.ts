/**
 * 都道府県クリエイター行の組み立て（サーバー専用）。
 * Vercel Functions 向けに相対 import のみ使用（@/ は Metro 専用ファイルへ分離）。
 */

import {
  buildKimitoPublicProfileUrl,
  buildSurechigaiShareUrl,
} from "../../../lib/kimito-link-urls.js";
import {
  isValidShareSlug,
  isValidTwitterUsername,
  normalizeTwitterUsername,
} from "../../../lib/twitter-username.js";
import type {
  PrefectureCreatorRow,
  PrefectureCreatorUserInput,
  TwitterCacheInfo,
  TwitterFollowInfo,
} from "./prefecture-creator-types.js";

export type {
  PrefectureCreatorRow,
  PrefectureCreatorUserInput,
  TwitterCacheInfo,
  TwitterFollowInfo,
};

export function extractTwitterIdFromOpenId(openId: string): string | null {
  const m = /^twitter:(.+)$/.exec(openId);
  return m?.[1] ?? null;
}

export function resolveTwitterCacheForUser(
  user: { id: number; openId: string; name: string | null; twitterUsername?: string | null },
  followByUserId: Map<number, TwitterFollowInfo>,
  cacheByTwitterId: Map<string, TwitterCacheInfo>,
  cacheByUsername: Map<string, TwitterCacheInfo>,
): TwitterCacheInfo | undefined {
  const hint = normalizeTwitterUsername(user.twitterUsername);
  if (hint) {
    const byHint = cacheByUsername.get(hint.toLowerCase());
    if (byHint) return byHint;
  }

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
    const followName = normalizeTwitterUsername(follow.twitterUsername);
    if (followName) {
      const byFollowName = cacheByUsername.get(followName.toLowerCase());
      if (byFollowName) return byFollowName;
    }
  }

  const nameCandidate = (user.name ?? "").replace(/^@/, "").trim();
  if (isValidTwitterUsername(nameCandidate)) {
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
    extractTwitterIdFromOpenId(user.openId) ??
    cached?.twitterId ??
    follow?.twitterId ??
    user.storedTwitterId ??
    null;
  const username =
    normalizeTwitterUsername(cached?.twitterUsername) ??
    normalizeTwitterUsername(follow?.twitterUsername) ??
    normalizeTwitterUsername(user.storedTwitterUsername);
  const kimitoLinkUrl = username ? buildKimitoPublicProfileUrl(username) : null;
  const validShareSlug = isValidShareSlug(user.shareSlug) ? user.shareSlug : null;
  const shareUrl = validShareSlug ? buildSurechigaiShareUrl(validShareSlug) : null;

  return {
    userId: user.userId,
    displayName: cached?.displayName ?? user.name,
    username,
    twitterId,
    profileImage: cached?.profileImage ?? null,
    followersCount: cached?.followersCount ?? null,
    kimitoLinkUrl,
    shareSlug: validShareSlug,
    shareUrl,
    lastStayedAt: user.lastStayedAt,
  };
}
