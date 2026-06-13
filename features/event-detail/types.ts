/**
 * Event Detail Screen Types
 * イベント詳細画面で使用する型定義
 */

import type { Participation } from "@/types/participation";

/**
 * 同伴者情報
 */
export interface Companion {
  id: string;
  displayName: string;
  twitterUsername: string;
  twitterId?: string;
  profileImage?: string;
}

/**
 * Twitter検索で取得したプロフィール
 */
export interface LookedUpProfile {
  id: string;
  name: string;
  username: string;
  profileImage: string;
}

/**
 * 性別フィルター
 */
export type GenderFilter = "all" | "male" | "female";

/**
 * 勢い情報
 */
export interface MomentumData {
  recent24h: number;
  recent1h: number;
  isHot: boolean;
}

/**
 * 都道府県別参加者数
 */
export type PrefectureCounts = Record<string, number>;

/**
 * 選択された地域
 */
export interface SelectedRegion {
  name: string;
  prefectures: string[];
}

/**
 * ファンプロフィール
 */
export interface FanProfile {
  twitterId: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

/**
 * 最後の参加表明情報（シェアモーダル用）
 */
export interface LastParticipation {
  name: string;
  username?: string;
  image?: string;
  message?: string;
  contribution: number;
  prefecture?: string;
}

/**
 * イベント詳細データ
 */
export interface EventDetailData {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  venue?: string;
  goalType?: string;
  goalValue?: number;
  goalUnit?: string;
  currentValue?: number;
  hostUserId?: number;
  hostTwitterId?: string;
  hostName: string;
  hostUsername?: string;
  hostProfileImage?: string;
  hostFollowersCount?: number;
  hostDescription?: string;
  ticketPresale?: number;
  ticketDoor?: number;
  ticketUrl?: string;
}

/**
 * 参加フォームの状態
 */
export interface ParticipationFormState {
  message: string;
  displayName: string;
  prefecture: string;
  gender: "male" | "female" | "";
  allowVideoUse: boolean;
  companions: Companion[];
  showForm: boolean;
  showPrefectureList: boolean;
  showConfirmation: boolean;
  showAddCompanionForm: boolean;
  newCompanionName: string;
  newCompanionTwitter: string;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: LookedUpProfile | null;
}

/**
 * フィルター状態
 */
export interface FilterState {
  selectedPrefectureFilter: string;
  showPrefectureFilterList: boolean;
  selectedGenderFilter: GenderFilter;
}

/**
 * モーダル状態
 */
export interface ModalState {
  selectedPrefectureForModal: string | null;
  selectedRegion: SelectedRegion | null;
  showHostProfileModal: boolean;
  selectedFan: FanProfile | null;
  showDeleteParticipationModal: boolean;
  deleteTargetParticipation: Participation | null;
  showSharePrompt: boolean;
}

// Re-export from features/events/components for backward compatibility
export type { Participation };
