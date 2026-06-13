/**
 * 勢いスコア計算ユーティリティ
 * チャレンジの「今熱い」度合いを計算する
 */

import type { Challenge } from "@/types/challenge";

/**
 * 勢いスコアの計算式:
 * 勢いスコア = (参加者数 × 進捗率) + (24時間以内の新規参加者数 × 2)
 * 
 * この計算式により、以下のチャレンジが上位に表示される:
 * - 参加者が多く、目標達成に近いチャレンジ
 * - 直近で盛り上がっているチャレンジ
 */
export function calculateMomentumScore(challenge: Challenge): number {
  const { currentValue, goalValue, recentParticipants = 0 } = challenge;
  
  // 進捗率（0-1）
  const progressRate = goalValue > 0 ? Math.min(1, currentValue / goalValue) : 0;
  
  // 基本スコア = 参加者数 × 進捗率
  const baseScore = currentValue * progressRate;
  
  // 直近の盛り上がりボーナス（24時間以内の新規参加者 × 2）
  const recentBonus = recentParticipants * 2;
  
  // 合計スコア
  return baseScore + recentBonus;
}

/**
 * チャレンジを勢いスコア順にソート
 */
export function sortByMomentumScore(challenges: Challenge[]): Challenge[] {
  return [...challenges].sort((a, b) => {
    const scoreA = calculateMomentumScore(a);
    const scoreB = calculateMomentumScore(b);
    return scoreB - scoreA; // 降順
  });
}

/**
 * 勢いスコアに基づいてTOP3を取得
 */
export function getTop3ByMomentum(challenges: Challenge[]): Challenge[] {
  return sortByMomentumScore(challenges).slice(0, 3);
}

/**
 * 勢いスコアに基づいてランキングを取得（4位以降）
 */
export function getRankingRest(challenges: Challenge[]): Challenge[] {
  return sortByMomentumScore(challenges).slice(3);
}

/**
 * 勢いレベルを取得（表示用）
 */
export function getMomentumLevel(challenge: Challenge): {
  level: "hot" | "warm" | "normal" | "cold";
  emoji: string;
  label: string;
  color: string;
} {
  const score = calculateMomentumScore(challenge);
  const progressRate = challenge.goalValue > 0 
    ? (challenge.currentValue / challenge.goalValue) * 100 
    : 0;

  if (score >= 100 || progressRate >= 80) {
    return { level: "hot", emoji: "🔥", label: "激アツ", color: "#EF4444" };
  }
  if (score >= 50 || progressRate >= 50) {
    return { level: "warm", emoji: "🌟", label: "注目", color: "#F59E0B" };
  }
  if (score >= 20 || progressRate >= 20) {
    return { level: "normal", emoji: "✨", label: "成長中", color: "#22C55E" };
  }
  return { level: "cold", emoji: "🌱", label: "スタート", color: "#6B7280" };
}

/**
 * イベントタイプでフィルタリング
 */
export function filterByEventType(
  challenges: Challenge[], 
  eventType: "solo" | "group" | "all"
): Challenge[] {
  if (eventType === "all") return challenges;
  return challenges.filter(c => c.eventType === eventType);
}
