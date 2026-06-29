/**
 * Clerk ユーザーの X プロフィールを DB に同期する（サーバー専用）。
 */

import { createClerkClient } from "@clerk/backend";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../drizzle/schema/index.js";
import { twitterUserCache } from "../drizzle/schema/index.js";
import {
  extractClerkUserIdFromOpenId,
  extractTwitterProfileFromClerkUser,
  type ClerkTwitterProfile,
} from "../lib/clerk-twitter-profile.js";
import { normalizeTwitterUsername } from "../lib/twitter-username.js";

type DB = PostgresJsDatabase<typeof schema>;

export type { ClerkTwitterProfile };

/** users.twitterUserCache + shareSlug を Clerk 情報で更新する。 */
export async function syncClerkTwitterProfileToDb(
  db: DB,
  userId: number,
  profile: ClerkTwitterProfile,
): Promise<void> {
  void userId;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .insert(twitterUserCache)
    .values({
      twitterUsername: profile.twitterUsername,
      twitterId: profile.twitterId,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      followersCount: 0,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: twitterUserCache.twitterUsername,
      set: {
        twitterId: profile.twitterId,
        displayName: profile.displayName,
        profileImage: profile.profileImage,
        expiresAt,
        updatedAt: new Date(),
      },
    });
}

/** openId が clerk:* のユーザー向けに Clerk API から X プロフィールを取得する。 */
export async function fetchClerkTwitterProfiles(
  openIds: string[],
): Promise<Map<string, ClerkTwitterProfile>> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  const result = new Map<string, ClerkTwitterProfile>();
  if (!secretKey || openIds.length === 0) return result;

  const clerk = createClerkClient({ secretKey });
  const uniqueIds = [
    ...new Set(
      openIds
        .map(extractClerkUserIdFromOpenId)
        .filter((id): id is string => !!id),
    ),
  ];

  await Promise.all(
    uniqueIds.map(async (clerkUserId) => {
      try {
        const clerkUser = await clerk.users.getUser(clerkUserId);
        const profile = extractTwitterProfileFromClerkUser(clerkUser);
        if (profile) result.set(`clerk:${clerkUserId}`, profile);
      } catch (err) {
        console.warn("[ClerkProfileSync] getUser failed:", clerkUserId, err);
      }
    }),
  );

  return result;
}

/** 都道府県一覧などで twitterUsername 未設定の Clerk ユーザーをバックフィルする。 */
export async function backfillClerkTwitterProfiles(
  db: DB,
  userRows: Array<{ id: number; openId: string; twitterUsername?: string | null; twitterId?: string | null }>,
): Promise<void> {
  const needsBackfill = userRows.filter(
    (u) => !normalizeTwitterUsername(u.twitterUsername) && u.openId.startsWith("clerk:"),
  );
  if (needsBackfill.length === 0) return;

  const profiles = await fetchClerkTwitterProfiles(needsBackfill.map((u) => u.openId));
  await Promise.all(
    needsBackfill.map(async (user) => {
      const profile = profiles.get(user.openId);
      if (!profile) return;
      await syncClerkTwitterProfileToDb(db, user.id, profile);
      user.twitterUsername = profile.twitterUsername;
      user.twitterId = profile.twitterId;
    }),
  );
}
