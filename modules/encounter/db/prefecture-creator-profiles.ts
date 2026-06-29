/**
 * 都道府県クリエイター一覧向けプロフィール解決（DB + Clerk + キャッシュ）。
 * 外部 enrich は未取得ユーザーに限り best-effort。
 */

import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import { twitterFollowStatus, twitterUserCache } from "../../../drizzle/schema/index.js";
import {
  extractTwitterIdFromOpenId,
  resolveTwitterCacheForUser,
  type TwitterCacheInfo,
} from "../core/prefecture-creator-row.js";
import type { ClerkTwitterProfile } from "../../../lib/clerk-twitter-profile.js";
import {
  isKimitoGeneratedProfileImage,
  pickBestProfileImage,
  resolveListProfileImage,
} from "../../../lib/profile-image.js";
import { normalizeTwitterUsername } from "../../../lib/twitter-username.js";

type DB = PostgresJsDatabase<typeof schema>;

export type PrefectureCreatorUserRecord = {
  id: number;
  name: string | null;
  openId: string;
  shareSlug: string | null;
  twitterUsername?: string | null;
  twitterId?: string | null;
};

const CACHE_FIELD_SELECT = {
  twitterUsername: twitterUserCache.twitterUsername,
  twitterId: twitterUserCache.twitterId,
  displayName: twitterUserCache.displayName,
  profileImage: twitterUserCache.profileImage,
  followersCount: twitterUserCache.followersCount,
};

function addCacheRow(
  map: Map<string, TwitterCacheInfo>,
  row: TwitterCacheInfo,
): void {
  map.set(`u:${row.twitterUsername.toLowerCase()}`, row);
  if (row.twitterId) map.set(`id:${row.twitterId}`, row);
}

function mapsFromCacheRows(rows: TwitterCacheInfo[]): {
  cacheByTwitterId: Map<string, TwitterCacheInfo>;
  cacheByUsername: Map<string, TwitterCacheInfo>;
} {
  const cacheByTwitterId = new Map<string, TwitterCacheInfo>();
  const cacheByUsername = new Map<string, TwitterCacheInfo>();
  for (const row of rows) {
    cacheByUsername.set(row.twitterUsername.toLowerCase(), row);
    if (row.twitterId) cacheByTwitterId.set(row.twitterId, row);
  }
  return { cacheByTwitterId, cacheByUsername };
}

function mergeWithClerkProfile(
  cached: TwitterCacheInfo | null | undefined,
  clerk: ClerkTwitterProfile | undefined,
): TwitterCacheInfo | null {
  const handle =
    normalizeTwitterUsername(clerk?.twitterUsername) ??
    normalizeTwitterUsername(cached?.twitterUsername);
  if (!handle) return cached ?? null;

  return {
    twitterUsername: handle,
    twitterId: clerk?.twitterId ?? cached?.twitterId ?? null,
    displayName: cached?.displayName ?? clerk?.displayName ?? null,
    profileImage: pickBestProfileImage(clerk?.profileImage, cached?.profileImage),
    followersCount: cached?.followersCount ?? null,
  };
}

/** 一覧表示用: userId → 解決済み X プロフィール（無ければ null） */
export async function resolvePrefectureCreatorProfiles(
  db: DB,
  activeUsers: PrefectureCreatorUserRecord[],
): Promise<Map<number, TwitterCacheInfo | null>> {
  const result = new Map<number, TwitterCacheInfo | null>();
  if (activeUsers.length === 0) return result;

  try {
    const { loadClerkTwitterProfilesForUsers } = await import(
      "../../../server/clerk-profile-sync.js"
    );
    const {
      enrichTwitterProfile,
      fetchTwitterApiProfile,
      upsertTwitterCacheRow,
      lookupCacheByDisplayNames,
      lookupCacheByDisplayNameFuzzy,
    } = await import("../../../server/creator-profile-enricher.js");

    const clerkProfiles = await loadClerkTwitterProfilesForUsers(db, activeUsers);

    const cacheByDisplayName = await lookupCacheByDisplayNames(
      db,
      activeUsers.map((u) => u.name).filter((n): n is string => !!n),
    );

    for (const user of activeUsers) {
      if (normalizeTwitterUsername(user.twitterUsername) || !user.name) continue;
      const hit =
        cacheByDisplayName.get(user.name) ??
        (await lookupCacheByDisplayNameFuzzy(db, user.name));
      if (hit) {
        user.twitterUsername = hit.twitterUsername;
        user.twitterId = hit.twitterId;
      }
    }

    const activeUserIds = activeUsers.map((u) => u.id);
    const followRows =
      activeUserIds.length > 0
        ? await db
            .select({
              userId: twitterFollowStatus.userId,
              twitterUsername: twitterFollowStatus.twitterUsername,
              twitterId: twitterFollowStatus.twitterId,
            })
            .from(twitterFollowStatus)
            .where(inArray(twitterFollowStatus.userId, activeUserIds))
        : [];

    const followByUserId = new Map(
      followRows.map((r) => [
        r.userId,
        { twitterUsername: r.twitterUsername, twitterId: r.twitterId },
      ]),
    );

    const twitterIds = new Set<string>();
    for (const u of activeUsers) {
      const fromOpenId = extractTwitterIdFromOpenId(u.openId);
      if (fromOpenId) twitterIds.add(fromOpenId);
      if (u.twitterId) twitterIds.add(u.twitterId);
    }
    for (const f of followRows) {
      if (f.twitterId) twitterIds.add(f.twitterId);
    }

    const usernameCandidates = new Set<string>();
    for (const u of activeUsers) {
      const n = normalizeTwitterUsername(u.twitterUsername);
      if (n) usernameCandidates.add(n);
      const follow = followByUserId.get(u.id);
      const fn = normalizeTwitterUsername(follow?.twitterUsername);
      if (fn) usernameCandidates.add(fn);
    }

    const cacheRowMap = new Map<string, TwitterCacheInfo>();
    const uniqueTwitterIds = [...twitterIds];

    if (uniqueTwitterIds.length > 0) {
      const byIdRows = await db
        .select(CACHE_FIELD_SELECT)
        .from(twitterUserCache)
        .where(inArray(twitterUserCache.twitterId, uniqueTwitterIds));
      for (const row of byIdRows) addCacheRow(cacheRowMap, row);
    }
    if (usernameCandidates.size > 0) {
      const byNameRows = await db
        .select(CACHE_FIELD_SELECT)
        .from(twitterUserCache)
        .where(inArray(twitterUserCache.twitterUsername, [...usernameCandidates]));
      for (const row of byNameRows) addCacheRow(cacheRowMap, row);
    }

    const { cacheByTwitterId, cacheByUsername } = mapsFromCacheRows([
      ...cacheRowMap.values(),
    ]);

    const needsEnrich = new Set<string>();
    const needsAvatar = new Set<string>();
    for (const user of activeUsers) {
      const clerk = clerkProfiles.get(user.openId);
      const cached = resolveTwitterCacheForUser(
        user,
        followByUserId,
        cacheByTwitterId,
        cacheByUsername,
      );
      const merged = mergeWithClerkProfile(cached, clerk);
      const handle =
        normalizeTwitterUsername(merged?.twitterUsername) ??
        normalizeTwitterUsername(user.twitterUsername) ??
        normalizeTwitterUsername(followByUserId.get(user.id)?.twitterUsername);

      if (handle && (!merged?.followersCount || !merged?.displayName)) {
        needsEnrich.add(handle);
      }
      const avatarCandidate = pickBestProfileImage(
        clerk?.profileImage,
        merged?.profileImage,
      );
      if (
        handle &&
        (!avatarCandidate || isKimitoGeneratedProfileImage(merged?.profileImage))
      ) {
        needsAvatar.add(handle);
      }
    }

    await Promise.allSettled([
      ...[...needsEnrich].map(async (username) => {
        const enriched = await enrichTwitterProfile(db, username);
        if (enriched) addCacheRow(cacheRowMap, enriched);
      }),
      ...[...needsAvatar].map(async (username) => {
        const twitter = await fetchTwitterApiProfile(username);
        if (twitter) {
          await upsertTwitterCacheRow(db, twitter);
          addCacheRow(cacheRowMap, twitter);
        }
      }),
    ]);

    const resolvedMaps = mapsFromCacheRows([...cacheRowMap.values()]);

    for (const user of activeUsers) {
      let cached = resolveTwitterCacheForUser(
        user,
        followByUserId,
        resolvedMaps.cacheByTwitterId,
        resolvedMaps.cacheByUsername,
      );

      if (!cached && user.name) {
        cached =
          cacheByDisplayName.get(user.name) ??
          (await lookupCacheByDisplayNameFuzzy(db, user.name)) ??
          undefined;
      }

      const clerk = clerkProfiles.get(user.openId);
      const merged = mergeWithClerkProfile(cached, clerk);
      if (!merged) {
        result.set(user.id, null);
        continue;
      }

      const handle = normalizeTwitterUsername(merged.twitterUsername);
      const profileImage = resolveListProfileImage(
        handle,
        clerk?.profileImage,
        merged.profileImage,
      );

      result.set(user.id, {
        ...merged,
        profileImage,
      });
    }
  } catch (err) {
    console.error("[resolvePrefectureCreatorProfiles] failed:", err);
    for (const user of activeUsers) {
      result.set(user.id, null);
    }
  }

  return result;
}

export function toPrefectureCreatorListProfile(
  user: PrefectureCreatorUserRecord,
  cached: TwitterCacheInfo | null,
  follow?: { twitterUsername?: string | null } | null,
): {
  displayName: string;
  twitterHandle: string | null;
  profileImage: string | null;
} {
  const twitterHandle =
    normalizeTwitterUsername(cached?.twitterUsername) ??
    normalizeTwitterUsername(user.twitterUsername) ??
    normalizeTwitterUsername(follow?.twitterUsername) ??
    null;

  const displayName =
    cached?.displayName?.trim() ||
    user.name?.trim() ||
    twitterHandle ||
    "名無し";

  return {
    displayName,
    twitterHandle,
    profileImage: resolveListProfileImage(twitterHandle, cached?.profileImage),
  };
}
