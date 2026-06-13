/**
 * イベント機能モジュール
 * 
 * イベント詳細画面で使用するコンポーネント、フック、ユーティリティをエクスポート
 */

// コンポーネント
export * from "./components";

// ViewModel型
export type { ProgressItemVM } from "./components/ProgressGrid";
export type { RegionGroupVM } from "./components/RegionMap";
export type { RankingItemVM } from "./components/ContributionRanking";
export type { MessageVM, MessageCardProps } from "./components/MessageCard";

// 型定義は types/participation.ts から再エクスポート
export type { Participation, Companion, FanProfile, HostProfile, Gender } from "@/types/participation";
export { genderLabels, genderIcons, getGenderLabel, getGenderIcon } from "@/types/participation";
