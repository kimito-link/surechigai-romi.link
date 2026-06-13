// features/events/mappers/participationVM.ts
// 参加者のViewModel型定義と変換関数

import { normalizePrefecture } from "../utils/prefectures";

/**
 * 参加者のViewModel（画面表示用）
 */
export type ParticipationVM = {
  id: string;
  twitterId: string;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  contribution: number;
  companionCount: number;
  prefecture: string | null;
  prefectureNormalized: string;
  gender: "male" | "female" | "unspecified" | null;
  isAnonymous: boolean;
  createdAt: Date;
  createdAtText: string;
  followersCount: number | null;
};

/**
 * 友人（同行者）のViewModel
 */
export type CompanionVM = {
  id: string;
  displayName: string;
  twitterUsername: string | null;
  twitterId: string | null;
  profileImage: string | null;
};

/**
 * ファンのViewModel（プロフィール表示用）
 */
export type FanVM = {
  twitterId: string;
  username: string | null;
  displayName: string;
  profileImage: string | null;
};

/**
 * APIレスポンスの参加者型（推論用）
 */
type RawParticipation = {
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
  createdAt: Date | string;
  followersCount?: number | null;
  gender?: "male" | "female" | "unspecified" | null;
};

/**
 * APIレスポンスの友人型（推論用）
 */
type RawCompanion = {
  id: number;
  displayName: string;
  twitterUsername: string | null;
  twitterId: string | null;
  profileImage: string | null;
};

/**
 * 相対時間を計算（例: "1時間前", "3日前"）
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay}日前`;
  }
  if (diffHour > 0) {
    return `${diffHour}時間前`;
  }
  if (diffMin > 0) {
    return `${diffMin}分前`;
  }
  return "たった今";
}

/**
 * 参加者をViewModelに変換
 */
export function toParticipationVM(raw: RawParticipation): ParticipationVM {
  const createdAt = raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt);
  
  return {
    id: String(raw.id),
    twitterId: raw.twitterId ?? "",
    displayName: raw.displayName,
    username: raw.username,
    profileImage: raw.profileImage,
    message: raw.message,
    contribution: raw.contribution,
    companionCount: raw.companionCount,
    prefecture: raw.prefecture,
    prefectureNormalized: normalizePrefecture(raw.prefecture ?? ""),
    gender: raw.gender ?? null,
    isAnonymous: raw.isAnonymous,
    createdAt,
    createdAtText: formatRelativeTime(createdAt),
    followersCount: raw.followersCount ?? null,
  };
}

/**
 * 参加者リストをViewModelリストに変換
 */
export function toParticipationVMList(rawList: RawParticipation[]): ParticipationVM[] {
  return rawList.map(toParticipationVM);
}

/**
 * 友人をViewModelに変換
 */
export function toCompanionVM(raw: RawCompanion): CompanionVM {
  return {
    id: String(raw.id),
    displayName: raw.displayName,
    twitterUsername: raw.twitterUsername,
    twitterId: raw.twitterId,
    profileImage: raw.profileImage,
  };
}

/**
 * 友人リストをViewModelリストに変換
 */
export function toCompanionVMList(rawList: RawCompanion[]): CompanionVM[] {
  return rawList.map(toCompanionVM);
}

/**
 * ParticipationVMからFanVMを抽出
 */
export function toFanVM(participation: ParticipationVM): FanVM {
  return {
    twitterId: participation.twitterId,
    username: participation.username,
    displayName: participation.displayName,
    profileImage: participation.profileImage,
  };
}
