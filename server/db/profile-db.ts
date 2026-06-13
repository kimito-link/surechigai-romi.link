import { getDb, eq, desc, sql, ne } from "./connection";
import { users, participations, challenges, userBadges, badges, twitterUserCache } from "../../drizzle/schema";

export async function getUserPublicProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // ユーザー情報
  const userResult = await db.select().from(users).where(eq(users.id, userId));
  if (userResult.length === 0) return null;
  const user = userResult[0];
  
  // 参加履歴（チャレンジ情報も含む）
  const participationList = await db
    .select({
      id: participations.id,
      challengeId: participations.challengeId,
      displayName: participations.displayName,
      username: participations.username,
      profileImage: participations.profileImage,
      message: participations.message,
      contribution: participations.contribution,
      prefecture: participations.prefecture,
      createdAt: participations.createdAt,
      // チャレンジ情報
      challengeTitle: challenges.title,
      challengeEventDate: challenges.eventDate,
      challengeVenue: challenges.venue,
      challengeGoalType: challenges.goalType,
      challengeHostName: challenges.hostName,
      challengeHostUsername: challenges.hostUsername,
      challengeCategoryId: challenges.categoryId,
    })
    .from(participations)
    .innerJoin(challenges, eq(participations.challengeId, challenges.id))
    .where(eq(participations.userId, userId))
    .orderBy(desc(participations.createdAt));
  
  // 獲得バッジ
  const badgeList = await db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
  const badgeIds = badgeList.map(b => b.badgeId);
  const badgeDetails = badgeIds.length > 0 ? await db.select().from(badges).where(sql`${badges.id} IN (${badgeIds.join(",")})`) : [];
  
  // 統計
  const totalContribution = participationList.reduce((sum, p) => sum + (p.contribution || 1), 0);
  const challengeIds = [...new Set(participationList.map(p => p.challengeId))];
  
  // カテゴリ別の参加数を集計
  const categoryStats: Record<number, number> = {};
  participationList.forEach(p => {
    const categoryId = p.challengeCategoryId || 0;
    categoryStats[categoryId] = (categoryStats[categoryId] || 0) + 1;
  });
  
  // 主催チャレンジ数
  const hostedChallenges = await db.select({ count: sql<number>`count(*)` }).from(challenges).where(eq(challenges.hostUserId, userId));
  
  // 最新の参加情報からプロフィール情報を取得
  const latestParticipation = participationList[0];
  
  // Twitter情報をキャッシュから取得
  let twitterData = null;
  if (latestParticipation?.username) {
    const twitterCache = await db.select().from(twitterUserCache).where(eq(twitterUserCache.twitterUsername, latestParticipation.username));
    if (twitterCache.length > 0) {
      twitterData = twitterCache[0];
    }
  }
  
  return {
    user: {
      id: user.id,
      name: user.name || latestParticipation?.displayName || "ユーザー",
      username: latestParticipation?.username || null,
      profileImage: latestParticipation?.profileImage || null,
      gender: user.gender,
      createdAt: user.createdAt,
      // TwitterUserCardに必要なフィールド
      twitterId: twitterData?.twitterId || null,
      followersCount: twitterData?.followersCount || 0,
      description: twitterData?.description || null,
    },
    stats: {
      totalContribution,
      participationCount: participationList.length,
      challengeCount: challengeIds.length,
      hostedCount: hostedChallenges[0]?.count || 0,
      badgeCount: badgeList.length,
    },
    categoryStats,
    participations: participationList,
    badges: badgeDetails,
  };
}

// おすすめホスト（同じカテゴリのチャレンジを開催しているホスト）
export async function getRecommendedHosts(userId?: number, categoryId?: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];
  
  // チャレンジを開催しているホストを取得
  const allChallenges = await db.select({
    hostUserId: challenges.hostUserId,
    hostName: challenges.hostName,
    hostUsername: challenges.hostUsername,
    hostProfileImage: challenges.hostProfileImage,
    categoryId: challenges.categoryId,
  }).from(challenges)
    .where(challenges.hostUserId ? ne(challenges.hostUserId, userId || 0) : undefined)
    .orderBy(desc(challenges.eventDate));
  
  // ホストごとにチャレンジ数を集計
  const hostMap = new Map<number, {
    hostUserId: number;
    hostName: string | null;
    hostUsername: string | null;
    hostProfileImage: string | null;
    challengeCount: number;
    categoryIds: Set<number>;
  }>();
  
  for (const c of allChallenges) {
    if (!c.hostUserId) continue;
    if (userId && c.hostUserId === userId) continue;
    
    const existing = hostMap.get(c.hostUserId);
    if (existing) {
      existing.challengeCount++;
      if (c.categoryId) existing.categoryIds.add(c.categoryId);
    } else {
      hostMap.set(c.hostUserId, {
        hostUserId: c.hostUserId,
        hostName: c.hostName,
        hostUsername: c.hostUsername,
        hostProfileImage: c.hostProfileImage,
        challengeCount: 1,
        categoryIds: c.categoryId ? new Set([c.categoryId]) : new Set(),
      });
    }
  }
  
  // カテゴリが指定されている場合、そのカテゴリのホストを優先
  let hosts = Array.from(hostMap.values());
  if (categoryId) {
    hosts.sort((a, b) => {
      const aHasCategory = a.categoryIds.has(categoryId) ? 1 : 0;
      const bHasCategory = b.categoryIds.has(categoryId) ? 1 : 0;
      if (aHasCategory !== bHasCategory) return bHasCategory - aHasCategory;
      return b.challengeCount - a.challengeCount;
    });
  } else {
    hosts.sort((a, b) => b.challengeCount - a.challengeCount);
  }
  
  return hosts.slice(0, limit).map(h => ({
    userId: h.hostUserId,
    name: h.hostName,
    username: h.hostUsername,
    profileImage: h.hostProfileImage,
    challengeCount: h.challengeCount,
  }));
}
