/**
 * チャレンジ関連の共通型定義
 *
 * 使用箇所:
 * - app/(tabs)/index.tsx
 * - features/home/components/FeaturedChallenge.tsx
 * - features/home/components/ChallengeCard.tsx
 */

/** チャレンジの基本情報 */
export interface Challenge {
  id: number;
  hostName: string;
  hostUsername: string | null;
  hostProfileImage: string | null;
  hostFollowersCount: number | null;
  title: string;
  description: string | null;
  goalType: string;
  goalValue: number;
  goalUnit: string;
  currentValue: number;
  eventType: string;
  eventDate: Date;
  venue: string | null;
  prefecture: string | null;
  status: string;
  /** 直近24時間の新規参加者数（オプション） */
  recentParticipants?: number;
}

/** フィルタータイプ */
export type FilterType = "all" | "solo" | "group" | "favorites";

/** イベントタイプのバッジ設定 */
export const eventTypeBadge: Record<string, { label: string; color: string }> = {
  solo: { label: "ソロ", color: "#EC4899" },
  group: { label: "グループ", color: "#8B5CF6" },
};
