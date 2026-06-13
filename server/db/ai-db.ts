import { getDb, eq, desc, sql, and } from "./connection";
import { challenges, participations } from "../../drizzle/schema";

/**
 * チャレンジのAIサマリーを更新する
 * 参加者追加・メッセージ追加時に非同期で呼び出される
 */
export async function refreshChallengeSummary(challengeId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // 1. 参加者数と地域分布を取得
    const participationData = await db.select({
      prefecture: participations.prefecture,
      count: sql<number>`COUNT(*)`,
    })
      .from(participations)
      .where(eq(participations.challengeId, challengeId))
      .groupBy(participations.prefecture);

    const regionSummary: Record<string, number> = {};
    let totalCount = 0;
    participationData.forEach(row => {
      if (row.prefecture) {
        regionSummary[row.prefecture] = row.count;
      }
      totalCount += row.count;
    });

    // 2. 上位貢献者を取得
    const topContributors = await db.select({
      name: participations.displayName,
      contribution: participations.contribution,
      message: participations.message,
    })
      .from(participations)
      .where(eq(participations.challengeId, challengeId))
      .orderBy(desc(participations.contribution))
      .limit(5);

    // 3. 最新メッセージを取得
    const recentMessages = await db.select({
      name: participations.displayName,
      message: participations.message,
      createdAt: participations.createdAt,
    })
      .from(participations)
      .where(and(
        eq(participations.challengeId, challengeId),
        sql`${participations.message} IS NOT NULL AND ${participations.message} != ''`
      ))
      .orderBy(desc(participations.createdAt))
      .limit(5);

    // 4. 最も盛り上がっている地域を特定
    let hotRegion: string | undefined;
    let maxCount = 0;
    Object.entries(regionSummary).forEach(([region, count]) => {
      if (count > maxCount) {
        maxCount = count;
        hotRegion = region;
      }
    });

    // 5. 参加者サマリーを構築
    const participantSummary = {
      totalCount,
      topContributors: topContributors.map(c => ({
        name: c.name,
        contribution: c.contribution,
        message: c.message || undefined,
      })),
      recentMessages: recentMessages.map(m => ({
        name: m.name,
        message: m.message || "",
        createdAt: m.createdAt.toISOString(),
      })),
      hotRegion,
    };

    // 6. チャレンジ情報を取得してAIサマリーを生成
    const challenge = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
    if (!challenge[0]) return;

    const c = challenge[0];
    const progressPercent = c.goalValue > 0 ? Math.round((c.currentValue / c.goalValue) * 100) : 0;
    const daysUntilEvent = Math.ceil((new Date(c.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // AIが理解しやすい自然言語サマリーを生成
    let aiSummary = `【${c.title}】${c.hostName}主催の${c.eventType === "group" ? "グループ" : "ソロ"}イベント。`;
    aiSummary += `目標${c.goalValue}${c.goalUnit}に対して現在${c.currentValue}${c.goalUnit}（達成率${progressPercent}%）。`;
    
    if (daysUntilEvent > 0) {
      aiSummary += `開催まで残り${daysUntilEvent}日。`;
    } else if (daysUntilEvent === 0) {
      aiSummary += `本日開催！`;
    } else {
      aiSummary += `イベント終了済み。`;
    }

    if (totalCount > 0) {
      aiSummary += `${totalCount}名が参加表明。`;
      if (hotRegion) {
        aiSummary += `${hotRegion}からの参加が最多（${regionSummary[hotRegion]}名）。`;
      }
    }

    if (recentMessages.length > 0) {
      aiSummary += `最新の応援：「${recentMessages[0].message}」（${recentMessages[0].name}）`;
    }

    // 7. 意図タグを生成
    const intentTags: string[] = [];
    intentTags.push(c.eventType === "group" ? "グループ" : "ソロ");
    intentTags.push(c.goalType);
    if (progressPercent >= 100) intentTags.push("達成済み");
    else if (progressPercent >= 80) intentTags.push("もうすぐ達成");
    else if (progressPercent >= 50) intentTags.push("順調");
    else intentTags.push("応援募集中");
    if (daysUntilEvent <= 7 && daysUntilEvent > 0) intentTags.push("直前");
    if (daysUntilEvent === 0) intentTags.push("本日開催");
    if (hotRegion) intentTags.push(hotRegion);

    // 8. データベースを更新
    await db.update(challenges).set({
      aiSummary,
      intentTags,
      regionSummary,
      participantSummary,
      aiSummaryUpdatedAt: new Date(),
    }).where(eq(challenges.id, challengeId));

  } catch (error) {
    console.error("[AI Summary] Failed to refresh challenge summary:", error);
  }
}

/**
 * AI向け1ホップ取得API
 * JOINなしでチャレンジの全情報を取得
 */
export async function getChallengeForAI(challengeId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!result[0]) return null;

  const c = result[0];
  
  // サマリーが古い場合は再計算をトリガー（非同期）
  const summaryAge = c.aiSummaryUpdatedAt 
    ? Date.now() - new Date(c.aiSummaryUpdatedAt).getTime()
    : Infinity;
  
  if (summaryAge > 5 * 60 * 1000) { // 5分以上古い場合
    // 非同期で更新（レスポンスはブロックしない）
    refreshChallengeSummary(challengeId).catch(console.error);
  }

  return {
    // 基本情報
    id: c.id,
    title: c.title,
    description: c.description,
    hostName: c.hostName,
    hostUsername: c.hostUsername,
    hostProfileImage: c.hostProfileImage,
    eventDate: c.eventDate,
    venue: c.venue,
    prefecture: c.prefecture,
    eventType: c.eventType,
    
    // 進捗情報
    goalType: c.goalType,
    goalValue: c.goalValue,
    goalUnit: c.goalUnit,
    currentValue: c.currentValue,
    progressPercent: c.goalValue > 0 ? Math.round((c.currentValue / c.goalValue) * 100) : 0,
    
    // AI向け非正規化データ（1ホップで取得可能）
    aiSummary: c.aiSummary,
    intentTags: c.intentTags,
    regionSummary: c.regionSummary,
    participantSummary: c.participantSummary,
    aiSummaryUpdatedAt: c.aiSummaryUpdatedAt,
  };
}

/**
 * AI向け検索（意図タグベース）
 */
export async function searchChallengesForAI(tags: string[], limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  // 全チャレンジを取得してタグでフィルタリング
  const allChallenges = await db.select().from(challenges).where(eq(challenges.isPublic, true)).limit(100);
  
  const scored = allChallenges.map(c => {
    const challengeTags = c.intentTags || [];
    const matchCount = tags.filter(t => challengeTags.includes(t)).length;
    return { challenge: c, score: matchCount };
  });

  // スコア順にソート
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(s => ({
    id: s.challenge.id,
    title: s.challenge.title,
    hostName: s.challenge.hostName,
    aiSummary: s.challenge.aiSummary,
    intentTags: s.challenge.intentTags,
    matchScore: s.score,
    progressPercent: s.challenge.goalValue > 0 
      ? Math.round((s.challenge.currentValue / s.challenge.goalValue) * 100) 
      : 0,
  }));
}

/**
 * 全チャレンジのAIサマリーを一括更新（バッチ処理用）
 */
export async function refreshAllChallengeSummaries() {
  const db = await getDb();
  if (!db) return { updated: 0 };

  const allChallenges = await db.select({ id: challenges.id }).from(challenges);
  
  let updated = 0;
  for (const c of allChallenges) {
    try {
      await refreshChallengeSummary(c.id);
      updated++;
    } catch (error) {
      console.error(`[AI Summary] Failed to update challenge ${c.id}:`, error);
    }
  }

  return { updated, total: allChallenges.length };
}
