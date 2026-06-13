import { getDb, eq, desc, sql } from "./connection";
import { participations, challenges } from "../../drizzle/schema";
import { invalidateEventsCache } from "./challenge-db";

/**
 * ユーザーの推し活状況を取得
 * @param userId ユーザーID（オプション）
 * @param twitterId TwitterID（オプション）
 */
export async function getOshikatsuStats(userId?: number, twitterId?: string) {
  const db = await getDb();
  if (!db) return null;
  
  if (!userId && !twitterId) return null;
  
  // 参加履歴を取得
  let participationList;
  if (userId) {
    participationList = await db.select({
      id: participations.id,
      challengeId: participations.challengeId,
      contribution: participations.contribution,
      createdAt: participations.createdAt,
    })
      .from(participations)
      .where(eq(participations.userId, userId))
      .orderBy(desc(participations.createdAt))
      .limit(20);
  } else if (twitterId) {
    participationList = await db.select({
      id: participations.id,
      challengeId: participations.challengeId,
      contribution: participations.contribution,
      createdAt: participations.createdAt,
    })
      .from(participations)
      .where(eq(participations.twitterId, twitterId))
      .orderBy(desc(participations.createdAt))
      .limit(20);
  } else {
    return null;
  }
  
  if (participationList.length === 0) {
    return {
      totalParticipations: 0,
      totalContribution: 0,
      recentChallenges: [],
    };
  }
  
  // 統計を計算
  const totalParticipations = participationList.length;
  const totalContribution = participationList.reduce((sum, p) => sum + (p.contribution || 1), 0);
  
  // チャレンジ情報を取得
  const challengeIds = [...new Set(participationList.map(p => p.challengeId))];
  const challengeList = await db.select({
    id: challenges.id,
    title: challenges.title,
    hostName: challenges.hostName,
  })
    .from(challenges)
    .where(sql`${challenges.id} IN (${sql.join(challengeIds.map(id => sql`${id}`), sql`, `)})`);
  
  const challengeMap = new Map(challengeList.map(c => [c.id, c]));
  
  // 最近の参加チャレンジを構築
  const recentChallenges = participationList.slice(0, 5).map(p => {
    const challenge = challengeMap.get(p.challengeId);
    return {
      id: p.challengeId,
      title: challenge?.title || "不明なチャレンジ",
      targetName: challenge?.hostName || "",
      participatedAt: p.createdAt.toISOString(),
    };
  });
  
  return {
    totalParticipations,
    totalContribution,
    recentChallenges,
  };
}

/**
 * チャレンジのcurrentValueを再計算して修正
 * 参加者テーブルから実際の数を集計してcurrentValueを更新
 */
export async function recalculateChallengeCurrentValues() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 全チャレンジを取得
  const allChallenges = await db.select({
    id: challenges.id,
    title: challenges.title,
    currentValue: challenges.currentValue,
    goalValue: challenges.goalValue,
  }).from(challenges);
  
  const results: Array<{
    id: number;
    title: string;
    oldValue: number;
    newValue: number;
    diff: number;
  }> = [];
  
  for (const challenge of allChallenges) {
    // participationsテーブルから実際の参加者数を計算
    const participationList = await db.select({
      contribution: participations.contribution,
      companionCount: participations.companionCount,
    }).from(participations).where(eq(participations.challengeId, challenge.id));
    
    // 実際の合計を計算（contribution + companionCount）
    const actualValue = participationList.reduce((sum, p) => {
      return sum + (p.contribution || 1) + (p.companionCount || 0);
    }, 0);
    
    const oldValue = challenge.currentValue || 0;
    const diff = actualValue - oldValue;
    
    // 差分がある場合のみ更新
    if (diff !== 0) {
      await db.update(challenges)
        .set({ currentValue: actualValue })
        .where(eq(challenges.id, challenge.id));
      
      results.push({
        id: challenge.id,
        title: challenge.title,
        oldValue,
        newValue: actualValue,
        diff,
      });
    }
  }
  
  invalidateEventsCache();
  return results;
}

/**
 * データ整合性レポートを取得（修正なし、確認のみ）
 */
export async function getDataIntegrityReport() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 全チャレンジを取得
  const allChallenges = await db.select({
    id: challenges.id,
    title: challenges.title,
    hostName: challenges.hostName,
    hostUsername: challenges.hostUsername,
    currentValue: challenges.currentValue,
    goalValue: challenges.goalValue,
    status: challenges.status,
    eventDate: challenges.eventDate,
  }).from(challenges).orderBy(desc(challenges.id));
  
  const report: Array<{
    id: number;
    title: string;
    hostName: string;
    hostUsername: string | null;
    status: string;
    eventDate: Date;
    goalValue: number;
    storedCurrentValue: number;
    actualParticipantCount: number;
    actualTotalContribution: number;
    hasDiscrepancy: boolean;
    discrepancyAmount: number;
    participationBreakdown: {
      totalParticipations: number;
      totalContribution: number;
      totalCompanions: number;
    };
  }> = [];
  
  for (const challenge of allChallenges) {
    // participationsテーブルから実際の参加者数を計算
    const participationList = await db.select({
      id: participations.id,
      contribution: participations.contribution,
      companionCount: participations.companionCount,
    }).from(participations).where(eq(participations.challengeId, challenge.id));
    
    const totalParticipations = participationList.length;
    const totalContribution = participationList.reduce((sum, p) => sum + (p.contribution || 1), 0);
    const totalCompanions = participationList.reduce((sum, p) => sum + (p.companionCount || 0), 0);
    const actualTotalContribution = totalContribution + totalCompanions;
    
    const storedCurrentValue = challenge.currentValue || 0;
    const hasDiscrepancy = storedCurrentValue !== actualTotalContribution;
    
    report.push({
      id: challenge.id,
      title: challenge.title,
      hostName: challenge.hostName,
      hostUsername: challenge.hostUsername,
      status: challenge.status,
      eventDate: challenge.eventDate,
      goalValue: challenge.goalValue,
      storedCurrentValue,
      actualParticipantCount: totalParticipations,
      actualTotalContribution,
      hasDiscrepancy,
      discrepancyAmount: actualTotalContribution - storedCurrentValue,
      participationBreakdown: {
        totalParticipations,
        totalContribution,
        totalCompanions,
      },
    });
  }
  
  return {
    totalChallenges: allChallenges.length,
    challengesWithDiscrepancy: report.filter(r => r.hasDiscrepancy).length,
    challenges: report,
  };
}

/**
 * データベーススキーマ情報を取得
 */
export async function getDbSchema() {
  const db = await getDb();
  if (!db) return { tables: [], error: "Database not available" };
  
  try {
    const result = await db.execute(sql`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    const raw = result as unknown as { rows?: unknown[] } | [unknown];
    const rows = Array.isArray(raw) ? raw[0] : raw?.rows;
    return { tables: (Array.isArray(rows) ? rows : []) ?? [] };
  } catch (error) {
    return { tables: [], error: String(error) };
  }
}

/**
 * コードとDBのスキーマを比較
 */
export async function compareSchemas() {
  const db = await getDb();
  if (!db) return { match: false, error: "Database not available" };
  
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const raw = result as unknown as { rows?: Array<{ table_name: string }> } | [unknown];
    const rows = Array.isArray(raw) ? raw[0] : raw?.rows;
    const dbTables = (Array.isArray(rows) ? rows : []).map((r: { table_name: string }) => r.table_name);
    
    const codeTables = [
      "users", "challenges", "participations", "notifications", "notification_settings",
      "badges", "user_badges", "cheers", "achievement_pages", "picked_comments",
      "reminders", "direct_messages", "challenge_templates", "follows", "search_history",
      "categories", "invitations", "invitation_uses", "participation_companions",
      "favorite_artists", "twitter_follow_status", "oauth_pkce_data", "twitter_user_cache",
      "challenge_members", "ticket_transfers", "ticket_waitlist", "collaborators",
      "collaborator_invitations", "achievements", "user_achievements", "challenge_stats"
    ];
    
    const missingInDb = codeTables.filter((t: string) => !dbTables.includes(t));
    const extraInDb = dbTables.filter((t: string) => !codeTables.includes(t));
    
    return {
      match: missingInDb.length === 0 && extraInDb.length === 0,
      dbTables,
      codeTables,
      missingInDb,
      extraInDb,
    };
  } catch (error) {
    return { match: false, error: String(error) };
  }
}
