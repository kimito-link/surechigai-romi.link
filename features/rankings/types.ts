/**
 * Rankings Feature Types
 * ランキング機能の型定義
 */

export type PeriodType = "weekly" | "monthly" | "all";
export type RankingTabType = "contribution" | "hosts";

export interface ContributionRankingItem {
  userId: number | null;
  userName: string | null;
  userImage: string | null;
  totalContribution: number;
  participationCount: number;
}

export interface HostRankingItem {
  hostUserId: number | null;
  hostName: string;
  hostProfileImage: string | null;
  totalParticipants: number;
  challengeCount: number;
  avgAchievementRate: number;
}

export type RankingItem = ContributionRankingItem | HostRankingItem;

export interface MyPosition {
  position: number | null;
  totalContribution: number | null;
}
