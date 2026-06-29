/**
 * 都道府県クリエイター一覧向けプロフィール enrichment。
 * kimito.link / X API / DB キャッシュを統合して同一サムネ・フォロワー数を返す。
 */

import { eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../drizzle/schema/index.js";
import { twitterUserCache } from "../drizzle/schema/index.js";
import { parseKimitoPublicProfileHtml } from "../lib/kimito-public-profile.js";
import { normalizeTwitterUsername } from "../lib/twitter-username.js";
import { getUserProfileByUsername } from "./twitter-oauth2.js";
import type { TwitterCacheInfo } from "../modules/encounter/core/prefecture-creator.js";

type DB = PostgresJsDatabase<typeof schema>;

const KIMITO_FETCH_TIMEOUT_MS = 8000;

function normalizeDisplayNameKey(name: string): string {
  return name.replace(/＠/g, "@").trim().toLowerCase();
}

export async function upsertTwitterCacheRow(
  db: DB,
  row: TwitterCacheInfo,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .insert(twitterUserCache)
    .values({
      twitterUsername: row.twitterUsername,
      twitterId: row.twitterId,
      displayName: row.displayName,
      profileImage: row.profileImage,
      followersCount: row.followersCount ?? 0,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: twitterUserCache.twitterUsername,
      set: {
        twitterId: row.twitterId,
        displayName: row.displayName,
        profileImage: row.profileImage,
        followersCount: row.followersCount ?? 0,
        expiresAt,
        updatedAt: new Date(),
      },
    });
}

export async function fetchKimitoPublicProfile(
  username: string,
): Promise<TwitterCacheInfo | null> {
  const clean = normalizeTwitterUsername(username);
  if (!clean) return null;

  try {
    const res = await fetch(`https://kimito.link/${encodeURIComponent(clean)}/`, {
      headers: { Accept: "text/html", "User-Agent": "surechigai-romi.link/1.0" },
      signal: AbortSignal.timeout(KIMITO_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const parsed = parseKimitoPublicProfileHtml(html, clean);
    if (!parsed) return null;
    return {
      twitterUsername: parsed.username,
      twitterId: null,
      displayName: parsed.displayName,
      profileImage: parsed.profileImage,
      followersCount: parsed.followersCount,
    };
  } catch (err) {
    console.warn("[KimitoProfile] fetch failed:", clean, err);
    return null;
  }
}

export async function fetchTwitterApiProfile(
  username: string,
): Promise<TwitterCacheInfo | null> {
  const profile = await getUserProfileByUsername(username);
  if (!profile) return null;
  return {
    twitterUsername: profile.username,
    twitterId: profile.id,
    displayName: profile.name,
    profileImage: profile.profile_image_url || null,
    followersCount: profile.public_metrics?.followers_count ?? null,
  };
}

/** X API → kimito.link HTML の順で取得し、DB キャッシュにも保存する。 */
export async function enrichTwitterProfile(
  db: DB,
  username: string,
): Promise<TwitterCacheInfo | null> {
  const clean = normalizeTwitterUsername(username);
  if (!clean) return null;

  let row =
    (await fetchTwitterApiProfile(clean)) ?? (await fetchKimitoPublicProfile(clean));
  if (!row) return null;

  await upsertTwitterCacheRow(db, row);
  return row;
}

/** displayName 一致で twitterUserCache を batch 取得（kimito.link 連携 DB 想定）。 */
export async function lookupCacheByDisplayNames(
  db: DB,
  displayNames: string[],
): Promise<Map<string, TwitterCacheInfo>> {
  const names = [...new Set(displayNames.filter(Boolean))];
  const result = new Map<string, TwitterCacheInfo>();
  if (names.length === 0) return result;

  const rows = await db
    .select({
      twitterUsername: twitterUserCache.twitterUsername,
      twitterId: twitterUserCache.twitterId,
      displayName: twitterUserCache.displayName,
      profileImage: twitterUserCache.profileImage,
      followersCount: twitterUserCache.followersCount,
    })
    .from(twitterUserCache)
    .where(inArray(twitterUserCache.displayName, names));

  for (const row of rows) {
    if (row.displayName) result.set(row.displayName, row);
  }
  return result;
}

/** 全角@など表記ゆれを吸収して displayName からキャッシュを1件引く。 */
export async function lookupCacheByDisplayNameFuzzy(
  db: DB,
  displayName: string,
): Promise<TwitterCacheInfo | null> {
  const key = normalizeDisplayNameKey(displayName);
  const rows = await db
    .select({
      twitterUsername: twitterUserCache.twitterUsername,
      twitterId: twitterUserCache.twitterId,
      displayName: twitterUserCache.displayName,
      profileImage: twitterUserCache.profileImage,
      followersCount: twitterUserCache.followersCount,
    })
    .from(twitterUserCache)
    .where(
      sql`lower(replace(${twitterUserCache.displayName}, '＠', '@')) = ${key}`,
    )
    .limit(1);
  return rows[0] ?? null;
}
