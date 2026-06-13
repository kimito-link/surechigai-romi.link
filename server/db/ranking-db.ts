import { getDb, eq, desc, sql } from "./connection";
import { participations, challenges } from "../../drizzle/schema";

export async function getGlobalContributionRanking(period: "weekly" | "monthly" | "all" = "all", limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  let dateFilter = sql`1=1`;
  const now = new Date();
  
  if (period === "weekly") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = sql`${participations.createdAt} >= ${weekAgo}`;
  } else if (period === "monthly") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = sql`${participations.createdAt} >= ${monthAgo}`;
  }
  
  const result = await db.select({
    userId: participations.userId,
    userName: participations.username,
    userImage: participations.profileImage,
    totalContribution: sql<number>`SUM(${participations.contribution})`,
    participationCount: sql<number>`COUNT(*)`,
  })
    .from(participations)
    .where(dateFilter)
    .groupBy(participations.userId, participations.username, participations.profileImage)
    .orderBy(sql`SUM(${participations.contribution}) DESC`)
    .limit(limit);
  
  return result;
}

export async function getChallengeAchievementRanking(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  // 達成率が高いチャレンジのランキング
  const result = await db.select({
    id: challenges.id,
    title: challenges.title,
    hostName: challenges.hostName,
    goalValue: challenges.goalValue,
    currentValue: challenges.currentValue,
    achievementRate: sql<number>`(${challenges.currentValue} / ${challenges.goalValue}) * 100`,
    eventDate: challenges.eventDate,
  })
    .from(challenges)
    .where(sql`${challenges.goalValue} > 0`)
    .orderBy(sql`(${challenges.currentValue} / ${challenges.goalValue}) DESC`)
    .limit(limit);
  
  return result;
}

export async function getHostRanking(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  // ホスト別のチャレンジ成功率ランキング
  const result = await db.select({
    hostUserId: challenges.hostUserId,
    hostName: challenges.hostName,
    hostProfileImage: challenges.hostProfileImage,
    challengeCount: sql<number>`COUNT(*)`,
    totalParticipants: sql<number>`SUM(${challenges.currentValue})`,
    avgAchievementRate: sql<number>`AVG((${challenges.currentValue} / ${challenges.goalValue}) * 100)`,
  })
    .from(challenges)
    .where(sql`${challenges.goalValue} > 0`)
    .groupBy(challenges.hostUserId, challenges.hostName, challenges.hostProfileImage)
    .orderBy(sql`AVG((${challenges.currentValue} / ${challenges.goalValue}) * 100) DESC`)
    .limit(limit);
  
  return result;
}

export async function getUserRankingPosition(userId: number, period: "weekly" | "monthly" | "all" = "all") {
  const db = await getDb();
  if (!db) return null;
  
  const ranking = await getGlobalContributionRanking(period, 1000);
  const position = ranking.findIndex(r => r.userId === userId);
  
  if (position === -1) return null;
  
  return {
    position: position + 1,
    totalContribution: ranking[position].totalContribution,
    participationCount: ranking[position].participationCount,
  };
}
