/**
 * Molecules - 複合コンポーネント
 * 
 * Atomsを組み合わせた再利用可能なコンポーネント群
 * v6.22: components/ui/からの再エクスポートに統一
 */

// ===== 新UIコンポーネント（components/ui/から再エクスポート） =====
// Card系
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardSection,
  type CardProps, 
  type CardHeaderProps, 
  type CardFooterProps,
  type CardSectionProps,
} from "@/components/ui/card";

// Modal系
export { 
  ConfirmModal, 
  AlertModal,
  type ConfirmModalProps,
  type AlertModalProps,
} from "@/components/ui/modal";

// ===== レガシーコンポーネント（段階的に移行） =====
// Card系（レガシー）
export { HoverableCard } from "./hoverable-card";
export { PressableCard } from "./pressable-card";
export * from "./animated-pressable";

// Image/Avatar系
export { LazyImage, LazyAvatar } from "./lazy-image";
export { OptimizedImage, OptimizedAvatar } from "./optimized-image";
export { ProgressiveImage } from "./progressive-image";

// ListItem系
export { HoverableListItem } from "./hoverable-list-item";

// Modal系（レガシー）
export { FollowSuccessModal } from "./follow-success-modal";
export { PrefectureParticipantsModal } from "./prefecture-participants-modal";
export { RegionParticipantsModal } from "./region-participants-modal";
export { LoginSuccessModal } from "./login-success-modal";
export { LoginSuccessModalWrapper } from "./login-success-modal-wrapper";
export { SharePromptModal } from "./share-prompt-modal";
export { LogoutConfirmModal } from "./logout-confirm-modal";
export { EncouragementModal, useEncouragementModal } from "./encouragement-modal";

// Form系
export { DatePicker } from "./date-picker";
export { ExportButton } from "./export-button";
export { ReminderButton } from "./reminder-button";
export { ShareButton } from "./share-button";
export { NumberStepper } from "./number-stepper";
export { FilterTabs } from "./filter-tabs";

// Character系
export { BlinkingCharacter, BlinkingLink } from "@/components/atoms/blinking-character";
export { DoinAnimation } from "./doin-animation";
export { ConfettiEffect } from "./confetti-effect";
export { InteractiveCharacter, TappableLink, LongPressCharacter } from "./interactive-character";
export { TalkingCharacter } from "./talking-character";
export { CharacterValidationError, CharacterGroupValidationError } from "./character-validation-error";

// Animation系
// AnimatedListItem is exported via "export * from ./animated-pressable" above
export { Collapsible } from "./collapsible";

// Utility系
export { EnhancedRefreshControl } from "./enhanced-refresh-control";
export { FollowGate } from "./follow-gate";
export { LoadingScreen } from "./loading-screen";
export { ResponsiveContainer } from "./responsive-container";
export { TutorialResetButton } from "./tutorial-reset-button";
export { ColorfulChallengeCard } from "./colorful-challenge-card";
export {
  TwitterUserCard,
  TwitterUserCompact,
  TwitterAvatar,
  toTwitterUserData,
  type TwitterUserData,
} from "./twitter-user-card";
export { InlineValidationError } from "./inline-validation-error";
