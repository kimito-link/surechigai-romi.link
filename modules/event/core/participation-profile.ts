/**
 * 参加表明用の表示名・サムネを DB ユーザー + twitterUserCache から解決。
 */

import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import { twitterUserCache } from "../../../drizzle/schema/index.js";
import type { User } from "../../../drizzle/schema/users.js";
import { lookupCacheByDisplayNameFuzzy } from "../../../server/creator-profile-enricher.js";

type DB = PostgresJsDatabase<typeof schema>;

function extractTwitterId(openId: string): string | null {
  const m = /^twitter:(.+)$/.exec(openId);
  return m ? m[1] : null;
}

export type ParticipationProfile = {
  displayName: string;
  username: string | null;
  profileImage: string | null;
  prefecture: string | null;
};

export async function resolveUserParticipationProfile(
  db: DB,
  user: User,
): Promise<ParticipationProfile> {
  let profileImage: string | null = null;
  let username: string | null = null;

  if (user.name) {
    const cached = await lookupCacheByDisplayNameFuzzy(db, user.name);
    profileImage = cached?.profileImage ?? null;
    username = cached?.twitterUsername ?? null;
  }

  const twitterId = extractTwitterId(user.openId);
  if (twitterId) {
    const rows = await db
      .select({
        profileImage: twitterUserCache.profileImage,
        twitterUsername: twitterUserCache.twitterUsername,
      })
      .from(twitterUserCache)
      .where(eq(twitterUserCache.twitterId, twitterId))
      .limit(1);
    if (rows[0]) {
      profileImage = profileImage ?? rows[0].profileImage ?? null;
      username = username ?? rows[0].twitterUsername ?? null;
    }
  }

  return {
    displayName: user.name ?? username ?? "参加者",
    username,
    profileImage,
    prefecture: user.prefecture,
  };
}
