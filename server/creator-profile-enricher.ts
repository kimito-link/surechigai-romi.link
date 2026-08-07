/**
 * 都道府県クリエイター一覧向けプロフィール enrichment。
 * kimito.link / X API / DB キャッシュを統合して同一サムネ・フォロワー数を返す。
 */

import { and, eq, gt, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../drizzle/schema/index.js";
import { twitterUserCache } from "../drizzle/schema/index.js";
import { parseKimitoPublicProfileHtml } from "../lib/kimito-public-profile.js";
import { pickBestProfileImage } from "../lib/profile-image.js";
import { normalizeTwitterUsername } from "../lib/twitter-username.js";
import type { TwitterCacheInfo } from "../modules/encounter/core/prefecture-creator-types.js";

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

  const existing = await db
    .select({ profileImage: twitterUserCache.profileImage })
    .from(twitterUserCache)
    .where(eq(twitterUserCache.twitterUsername, row.twitterUsername))
    .limit(1);

  const profileImage = pickBestProfileImage(
    row.profileImage,
    existing[0]?.profileImage,
  );

  await db
    .insert(twitterUserCache)
    .values({
      twitterUsername: row.twitterUsername,
      twitterId: row.twitterId,
      displayName: row.displayName,
      profileImage,
      followersCount: row.followersCount ?? 0,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: twitterUserCache.twitterUsername,
      set: {
        twitterId: row.twitterId,
        displayName: row.displayName,
        profileImage,
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
      // kimito OGP はフォロワー/表示名用。サムネは X API / Clerk のみ。
      profileImage: null,
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
  const { getUserProfileByUsername } = await import("./twitter-oauth2.js");
  const profile = await getUserProfileByUsername(username);
  if (!profile) return null;
  return {
    twitterUsername: profile.username,
    twitterId: profile.id,
    displayName: profile.name,
    profileImage:
      profile.profile_image_url?.replace("_normal", "_400x400") || null,
    followersCount: profile.public_metrics?.followers_count ?? null,
  };
}

/** kimito.link（フォロワー等）+ X API（アバター）を統合してキャッシュ保存。 */
/**
 * 期限内（expiresAt が未来）のキャッシュ行を返す。無ければ null。
 *
 * これは「外部APIを叩くのを省いてよいか」の判定にだけ使う。
 * **期限切れ行を表示から除外する用途に使ってはいけない** —
 * 読み取り側で期限を見ると、表示できていたアバターが突然消える
 * （docs/API_COST_MANAGEMENT.md の方針: 古い値でも出す方がユーザーには良い）。
 */
async function findFreshCacheRow(
  db: DB,
  cleanUsername: string,
): Promise<TwitterCacheInfo | null> {
  try {
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
        and(
          eq(twitterUserCache.twitterUsername, cleanUsername),
          gt(twitterUserCache.expiresAt, new Date()),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    // 画像が無い行は「取れていない」ので取り直す価値がある（アバターが出ないままになる）。
    if (!row.profileImage) return null;
    return row;
  } catch {
    // 判定に失敗したら従来どおり取り直す（fail-open。表示を止めない）。
    return null;
  }
}

export async function enrichTwitterProfile(
  db: DB,
  username: string,
  options?: {
    /** キャッシュが新鮮でも強制的に取り直す（既定 false）。 */
    force?: boolean;
  },
): Promise<TwitterCacheInfo | null> {
  const clean = normalizeTwitterUsername(username);
  if (!clean) return null;

  // ★キャッシュが生きている間は外部APIを叩かない（2026-08-07）。
  // ここは X API（無料枠は月100件・docs/API_COST_MANAGEMENT.md）と kimito.link を叩く経路で、
  // server/clerk-auth-sync.ts:70 から**ログイン毎に無条件で**呼ばれていた。
  // upsertTwitterCacheRow は expiresAt に7日後を入れているのに読み取り側が誰も見ておらず、
  // 同じユーザーが再ログインするたび無料枠を消費していた。
  if (!options?.force) {
    const fresh = await findFreshCacheRow(db, clean);
    if (fresh) return fresh;
  }

  const [kimito, twitter] = await Promise.all([
    fetchKimitoPublicProfile(clean),
    fetchTwitterApiProfile(clean),
  ]);
  if (!kimito && !twitter) return null;

  const row: TwitterCacheInfo = {
    twitterUsername: clean,
    twitterId: twitter?.twitterId ?? kimito?.twitterId ?? null,
    displayName: kimito?.displayName ?? twitter?.displayName ?? null,
    profileImage: pickBestProfileImage(twitter?.profileImage, kimito?.profileImage),
    followersCount: kimito?.followersCount ?? twitter?.followersCount ?? null,
  };

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
