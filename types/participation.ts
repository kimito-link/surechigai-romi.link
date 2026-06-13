/**
 * 参加者関連の共通型定義
 * 
 * 使用箇所:
 * - app/event/[id].tsx
 * - components/organisms/participant-ranking.tsx
 * - components/molecules/prefecture-participants-modal.tsx
 */

/** 参加者の基本情報 */
export interface Participation {
  id: number;
  userId: number | null;
  twitterId: string | null;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  companionCount: number;
  contribution: number;
  prefecture: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  followersCount?: number | null;
  gender?: "male" | "female" | "unspecified" | null;
}

/** 同伴者情報 */
export interface Companion {
  id: number;
  name: string;
  prefecture: string | null;
  gender?: "male" | "female" | "unspecified" | null;
}

/** ファンプロフィール（モーダル表示用） */
export interface FanProfile {
  twitterId: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

/** 主催者プロフィール（モーダル表示用） */
export interface HostProfile {
  twitterId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  followersCount?: number;
  description?: string;
}

/** 性別の型 */
export type Gender = "male" | "female" | "unspecified";

/** 性別の表示名 */
export const genderLabels: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  unspecified: "未設定",
};

/** 性別のアイコン */
export const genderIcons: Record<Gender, string> = {
  male: "♂",
  female: "♀",
  unspecified: "?",
};

/**
 * 性別の表示名を取得
 */
export function getGenderLabel(gender: Gender | null | undefined): string {
  return genderLabels[gender || "unspecified"];
}

/**
 * 性別のアイコンを取得
 */
export function getGenderIcon(gender: Gender | null | undefined): string {
  return genderIcons[gender || "unspecified"];
}
