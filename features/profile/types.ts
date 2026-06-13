/**
 * features/profile/types.ts
 * プロフィール画面の型定義
 */

import type { Badge } from "@/drizzle/schema/gamification";

/** profiles.get の戻り値から型推論したプロフィール参加履歴 */
export interface ProfileParticipation {
  id: number;
  challengeId: number;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  contribution: number;
  prefecture: string | null;
  createdAt: Date;
  challengeTitle: string | null;
  challengeEventDate: Date | null;
  challengeVenue: string | null;
  challengeGoalType: string | null;
  challengeHostName: string | null;
  challengeHostUsername: string | null;
  challengeCategoryId: number | null;
}

/** profiles.get の戻り値の型 */
export interface PublicProfile {
  user: {
    id: number;
    name: string;
    username: string | null;
    profileImage: string | null;
    gender: "male" | "female" | "unspecified" | null;
    createdAt: Date | null;
    twitterId: string | null;
    followersCount: number;
    description: string | null;
  };
  stats: {
    totalContribution: number;
    participationCount: number;
    challengeCount: number;
    hostedCount: number;
    badgeCount: number;
  };
  categoryStats: Record<number, number>;
  participations: ProfileParticipation[];
  badges: Badge[];
}
