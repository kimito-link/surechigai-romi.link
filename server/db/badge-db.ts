import { getDb, eq, desc, and } from "./connection";
import { badges, userBadges, participations, InsertBadge } from "../../drizzle/schema";

export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges);
}

export async function getBadgeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(badges).where(eq(badges.id, id));
  return result[0] || null;
}

export async function createBadge(data: InsertBadge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(badges).values(data);
  return result.insertId ?? null;
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}

export async function getUserBadgesWithDetails(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const userBadgeList = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const badgeList = await db.select().from(badges);

  return userBadgeList.map(ub => ({
    ...ub,
    badge: badgeList.find(b => b.id === ub.badgeId),
  }));
}

export async function awardBadge(userId: number, badgeId: number, challengeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 既に持っているかチェック
  const existing = await db.select().from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));

  if (existing.length > 0) return null; // 既に持っている

  const [result] = await db.insert(userBadges).values({
    userId,
    badgeId,
    challengeId,
  });
  return result.insertId ?? null;
}

export async function checkAndAwardBadges(userId: number, challengeId: number, contribution: number) {
  const db = await getDb();
  if (!db) return [];

  const badgeList = await db.select().from(badges);
  const awardedBadges: typeof badgeList = [];

  // 参加回数をチェック
  const participationCount = await db.select().from(participations).where(eq(participations.userId, userId));

  for (const badge of badgeList) {
    let shouldAward = false;

    switch (badge.conditionType) {
      case "first_participation":
        shouldAward = participationCount.length === 1;
        break;
      case "contribution_5":
        shouldAward = contribution >= 5;
        break;
      case "contribution_10":
        shouldAward = contribution >= 10;
        break;
      case "contribution_20":
        shouldAward = contribution >= 20;
        break;
    }

    if (shouldAward) {
      const awarded = await awardBadge(userId, badge.id, challengeId);
      if (awarded) awardedBadges.push(badge);
    }
  }

  return awardedBadges;
}

// フォロワーバッジを付与
export async function awardFollowerBadge(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // フォロワーバッジを取得（なければ作成）
  let followerBadge = await db.select().from(badges).where(eq(badges.conditionType, "follower_badge"));

  if (followerBadge.length === 0) {
    // フォロワーバッジを作成
    const result = await db.insert(badges).values({
      name: "💜 公式フォロワー",
      description: "ホストをフォローして応援しています！",
      type: "special",
      conditionType: "follower_badge",
    });
    followerBadge = await db.select().from(badges).where(eq(badges.id, result[0].insertId!));
  }

  if (followerBadge.length === 0) return null;

  // バッジを付与
  return awardBadge(userId, followerBadge[0].id);
}
