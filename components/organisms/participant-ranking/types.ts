/**
 * ParticipantRanking - 型定義
 * 
 * 単一責任: 型定義のみ
 */

/** 参加者情報 */
export interface Participant {
  id: number;
  userId: number | null;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  contribution: number;
  companionCount: number;
  message: string | null;
  isAnonymous: boolean;
  createdAt?: Date | string;
  gender?: "male" | "female" | "unspecified" | null;
}

/** ランク付き参加者 */
export interface RankedParticipant extends Participant {
  rank: number;
}

/** ParticipantRankingのProps */
export interface ParticipantRankingProps {
  participants: Participant[];
  maxDisplay?: number;
  showBadges?: boolean;
  title?: string;
}

/** RankBadgeのProps */
export interface RankBadgeProps {
  rank: number;
}

/** RankItemのProps */
export interface RankItemProps {
  participant: Participant;
  rank: number;
  showBadge: boolean;
}

/** TopThreeRankingのProps */
export interface TopThreeRankingProps {
  participants: Participant[];
}

/** TopThreeItemのProps */
export interface TopThreeItemProps {
  participant: Participant;
  rank: 1 | 2 | 3;
  isFirst?: boolean;
}

/** RankingEmptyStateのProps */
export interface RankingEmptyStateProps {
  title: string;
}

/** RankingHeaderのProps */
export interface RankingHeaderProps {
  title: string;
  avgContribution: string;
}

/** MoreIndicatorのProps */
export interface MoreIndicatorProps {
  remainingCount: number;
}
