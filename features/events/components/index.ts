/**
 * イベント詳細画面用コンポーネント
 * 
 * app/event/[id].tsx から分離したローカルコンポーネント
 */

// 既存コンポーネント
export { ProgressGrid, type ProgressItemVM, type ProgressGridProps } from "./ProgressGrid";
export { RegionMap, type RegionGroupVM, type RegionMapProps } from "./RegionMap";
export { ParticipantsList } from "./ParticipantsList";
export { ContributionRanking, type RankingItemVM, type ContributionRankingProps } from "./ContributionRanking";
export { MessageCard, type MessageVM, type MessageCardProps } from "./MessageCard";

// ヘッダー・ナビゲーション
export { EventHeader, type EventHeaderProps } from "./EventHeader";
export { EventTabs, type EventTabsProps, type EventTab } from "./EventTabs";

// セクションコンポーネント
export { ProgressSection, type ProgressSectionProps } from "./ProgressSection";
export { EventInfoSection, type EventInfoSectionProps } from "./EventInfoSection";
export { ParticipantsSection, type ParticipantsSectionProps, type ParticipantVM } from "./ParticipantsSection";
export { ActionButtonsSection, type ActionButtonsSectionProps } from "./ActionButtonsSection";
export { CountdownSection, type CountdownSectionProps } from "./CountdownSection";
export { ShareButtons, type ShareButtonsProps } from "./ShareButtons";

// メッセージ関連
export { MessagesSection, type MessagesSectionProps, type GenderFilter } from "./MessagesSection";

// フォーム・モーダル
export { ParticipationForm, type ParticipationFormProps, type Companion, type LookedUpProfile } from "./ParticipationForm";
export { ConfirmationModal, type ConfirmationModalProps } from "./ConfirmationModal";
export { DeleteParticipationModal, type DeleteParticipationModalProps } from "./DeleteParticipationModal";
