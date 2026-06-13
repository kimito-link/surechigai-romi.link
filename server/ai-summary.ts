/**
 * AI向けサマリー再計算ロジック
 * 
 * 生成AI時代のDB設計パターン:
 * - 非正規化データを事前計算して保存
 * - 1ホップで取得可能なコンテキストドキュメントを生成
 * - 鮮度管理（イベント駆動で再計算）
 */

import { getDb } from "./db";
import { challenges, participations } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

// 地域サマリーの型
type RegionSummary = Record<string, number>;

// 参加者サマリーの型
interface ParticipantSummary {
  totalCount: number;
  topContributors: Array<{ name: string; contribution: number; message?: string }>;
  recentMessages: Array<{ name: string; message: string; createdAt: string }>;
  hotRegion?: string;
}

/**
 * チャレンジの地域サマリーを計算
 */
export async function calculateRegionSummary(challengeId: number): Promise<RegionSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select({
      prefecture: participations.prefecture,
      count: sql<number>`SUM(${participations.contribution})`,
    })
    .from(participations)
    .where(eq(participations.challengeId, challengeId))
    .groupBy(participations.prefecture);

  const summary: RegionSummary = {};
  for (const row of result) {
    if (row.prefecture) {
      summary[row.prefecture] = Number(row.count) || 0;
    }
  }
  return summary;
}

/**
 * チャレンジの参加者サマリーを計算
 */
export async function calculateParticipantSummary(challengeId: number): Promise<ParticipantSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 総参加者数
  const totalResult = await db
    .select({
      total: sql<number>`SUM(${participations.contribution})`,
    })
    .from(participations)
    .where(eq(participations.challengeId, challengeId));
  
  const totalCount = Number(totalResult[0]?.total) || 0;

  // 上位貢献者（トップ5）
  const topContributorsResult = await db
    .select({
      name: participations.displayName,
      contribution: participations.contribution,
      message: participations.message,
    })
    .from(participations)
    .where(eq(participations.challengeId, challengeId))
    .orderBy(desc(participations.contribution))
    .limit(5);

  const topContributors = topContributorsResult.map((row: { name: string; contribution: number; message: string | null }) => ({
    name: row.name,
    contribution: row.contribution,
    message: row.message || undefined,
  }));

  // 最新メッセージ（最新5件、メッセージがあるもののみ）
  const recentMessagesResult = await db
    .select({
      name: participations.displayName,
      message: participations.message,
      createdAt: participations.createdAt,
    })
    .from(participations)
    .where(eq(participations.challengeId, challengeId))
    .orderBy(desc(participations.createdAt))
    .limit(10);

  const recentMessages = recentMessagesResult
    .filter((row: { name: string; message: string | null; createdAt: Date }) => row.message)
    .slice(0, 5)
    .map((row: { name: string; message: string | null; createdAt: Date }) => ({
      name: row.name,
      message: row.message!,
      createdAt: row.createdAt.toISOString(),
    }));

  // 最も盛り上がっている地域
  const regionSummary = await calculateRegionSummary(challengeId);
  let hotRegion: string | undefined;
  let maxCount = 0;
  for (const [region, count] of Object.entries(regionSummary)) {
    if (count > maxCount) {
      maxCount = count;
      hotRegion = region;
    }
  }

  return {
    totalCount,
    topContributors,
    recentMessages,
    hotRegion,
  };
}

/**
 * チャレンジの意図タグを生成
 */
export function generateIntentTags(challenge: {
  title: string;
  description?: string | null;
  goalType: string;
  eventType: string;
  venue?: string | null;
}): string[] {
  const tags: string[] = [];

  // 目標タイプに基づくタグ
  switch (challenge.goalType) {
    case "attendance":
      tags.push("動員", "ライブ", "イベント");
      break;
    case "followers":
      tags.push("フォロワー", "SNS", "拡散");
      break;
    case "viewers":
      tags.push("同接", "配信", "視聴");
      break;
    case "points":
      tags.push("ポイント", "投票", "ランキング");
      break;
  }

  // イベントタイプに基づくタグ
  if (challenge.eventType === "group") {
    tags.push("グループ", "コラボ");
  } else {
    tags.push("ソロ", "個人");
  }

  // タイトルからキーワード抽出
  const titleKeywords = ["生誕祭", "ワンマン", "フェス", "配信", "プレミア", "記念"];
  for (const keyword of titleKeywords) {
    if (challenge.title.includes(keyword)) {
      tags.push(keyword);
    }
  }

  // 会場情報からタグ
  if (challenge.venue) {
    if (challenge.venue.includes("オンライン") || challenge.venue.includes("配信")) {
      tags.push("オンライン");
    } else {
      tags.push("オフライン", "現地");
    }
  }

  return [...new Set(tags)]; // 重複除去
}

/**
 * AIサマリーを生成（LLMを使用しない簡易版）
 */
export function generateAiSummary(
  challenge: { title: string; goalValue: number; currentValue: number },
  participantSummary: ParticipantSummary
): string {
  const progress = Math.round((challenge.currentValue / challenge.goalValue) * 100);
  const remaining = challenge.goalValue - challenge.currentValue;

  let summary = `「${challenge.title}」は現在${progress}%達成（${challenge.currentValue}/${challenge.goalValue}人）。`;

  if (participantSummary.hotRegion) {
    summary += `${participantSummary.hotRegion}からの参加が最も多い。`;
  }

  if (participantSummary.topContributors.length > 0) {
    const topContributor = participantSummary.topContributors[0];
    summary += `最大貢献者は${topContributor.name}さん（+${topContributor.contribution}人）。`;
  }

  if (remaining > 0) {
    summary += `目標達成まであと${remaining}人！`;
  } else {
    summary += `目標達成済み！🎉`;
  }

  return summary;
}

/**
 * チャレンジのAI向けサマリーを更新
 */
export async function updateChallengeSummary(challengeId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // チャレンジ情報を取得
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);

  if (!challenge) {
    throw new Error(`Challenge not found: ${challengeId}`);
  }

  // 各サマリーを計算
  const regionSummary = await calculateRegionSummary(challengeId);
  const participantSummary = await calculateParticipantSummary(challengeId);
  const intentTags = generateIntentTags(challenge);
  const aiSummary = generateAiSummary(challenge, participantSummary);

  // データベースを更新
  await db
    .update(challenges)
    .set({
      regionSummary,
      participantSummary,
      intentTags,
      aiSummary,
      aiSummaryUpdatedAt: new Date(),
    })
    .where(eq(challenges.id, challengeId));

  console.log(`[AI Summary] Updated challenge ${challengeId}`);
}

/**
 * 全チャレンジのサマリーを一括更新（バッチ処理用）
 */
export async function updateAllChallengeSummaries(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allChallenges = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.status, "active"));

  console.log(`[AI Summary] Updating ${allChallenges.length} challenges...`);

  for (const challenge of allChallenges) {
    try {
      await updateChallengeSummary(challenge.id);
    } catch (error) {
      console.error(`[AI Summary] Failed to update challenge ${challenge.id}:`, error);
    }
  }

  console.log(`[AI Summary] Batch update completed`);
}
