import { getDb, eq, desc, sql, and } from "./connection";
import { follows, searchHistory, participations, InsertFollow, InsertSearchHistory } from "../../drizzle/schema";
import { awardFollowerBadge } from "./badge-db";

// ========== Search History (検索履歴) ==========

export async function saveSearchHistory(history: InsertSearchHistory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(searchHistory).values(history);
  return result.insertId ?? null;
}

export async function getSearchHistoryForUser(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

export async function clearSearchHistoryForUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
}

// ========== Follows (フォロー) ==========

export async function followUser(follow: InsertFollow) {
  const db = await getDb();
  if (!db) return null;

  // 既にフォロー済みかチェック
  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, follow.followerId), eq(follows.followeeId, follow.followeeId)));

  if (existing.length > 0) return null; // 既にフォロー済み

  const [result] = await db.insert(follows).values(follow);

  await awardFollowerBadge(follow.followerId);

  return result.insertId ?? null;
}

export async function unfollowUser(followerId: number, followeeId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
}

export async function getFollowersForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // フォロワーの情報を取得（フォロワーのプロフィール画像も含む）
  const result = await db.select().from(follows).where(eq(follows.followeeId, userId)).orderBy(desc(follows.createdAt));

  // 各フォロワーのプロフィール画像を取得
  const followersWithImages = await Promise.all(result.map(async (f) => {
    // フォロワーの最新の参加情報からプロフィール画像を取得
    const latestParticipation = await db.select({ profileImage: participations.profileImage })
      .from(participations)
      .where(eq(participations.userId, f.followerId))
      .orderBy(desc(participations.createdAt))
      .limit(1);

    return {
      ...f,
      followerImage: latestParticipation[0]?.profileImage || null,
    };
  }));

  return followersWithImages;
}

export async function getFollowingForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(follows).where(eq(follows.followerId, userId)).orderBy(desc(follows.createdAt));
}

export async function isFollowing(followerId: number, followeeId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  return result.length > 0;
}

export async function getFollowerCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followeeId, userId));
  return result[0]?.count || 0;
}

export async function getFollowingCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, userId));
  return result[0]?.count || 0;
}

// 特定ユーザーのフォロワーID一覧を取得（ランキング優先表示用）
export async function getFollowerIdsForUser(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ followerId: follows.followerId }).from(follows).where(eq(follows.followeeId, userId));
  return result.map(r => r.followerId);
}

export async function updateFollowNotification(followerId: number, followeeId: number, notify: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(follows).set({ notifyNewChallenge: notify })
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
}
