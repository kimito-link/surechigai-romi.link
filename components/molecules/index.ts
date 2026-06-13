/**
 * Molecules - 複合コンポーネント
 *
 * Atomsを組み合わせた再利用可能なコンポーネント群
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

// ===== レガシーコンポーネント =====
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
export { LoginSuccessModal } from "./login-success-modal";
export { LoginSuccessModalWrapper } from "./login-success-modal-wrapper";
export { LogoutConfirmModal } from "./logout-confirm-modal";
export { EncouragementModal, useEncouragementModal } from "./encouragement-modal";

// Form系
export { DatePicker } from "./date-picker";
export { NumberStepper } from "./number-stepper";
export { FilterTabs } from "./filter-tabs";

// Animation系
export { ConfettiEffect } from "./confetti-effect";
export { Collapsible } from "./collapsible";

// Utility系
export { EnhancedRefreshControl } from "./enhanced-refresh-control";
export { LoadingScreen } from "./loading-screen";
export { ResponsiveContainer } from "./responsive-container";
export { InlineValidationError } from "./inline-validation-error";
export { SimpleRefreshControl } from "./enhanced-refresh-control";
export { RefreshingIndicator } from "./refreshing-indicator";
