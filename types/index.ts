/**
 * Types - 共通型定義の統一エクスポート
 * 
 * v6.22: 型安全性の強化
 * 
 * 使用方法:
 * ```tsx
 * import type { Challenge, Participation, FilterType } from "@/types";
 * ```
 */

// ===== Challenge関連 =====
export type { Challenge, FilterType } from "./challenge";
export { eventTypeBadge } from "./challenge";

// ===== Participation関連 =====
export type { 
  Participation, 
  Companion, 
  FanProfile, 
  HostProfile, 
  Gender 
} from "./participation";
export { 
  genderLabels, 
  genderIcons, 
  getGenderLabel, 
  getGenderIcon 
} from "./participation";

// ===== UI関連の型（components/ui/から再エクスポート） =====
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  IconButtonProps,
  FABProps,
} from "@/components/ui/button";

export type {
  CardProps,
  CardHeaderProps,
  CardFooterProps,
  CardSectionProps,
  CardVariant,
  CardPadding,
} from "@/components/ui/card";

export type {
  ModalProps,
  ConfirmModalProps,
  AlertModalProps,
} from "@/components/ui/modal";

export type {
  InputProps,
  SearchInputProps,
} from "@/components/ui/input";

export type {
  ListItemProps,
  AvatarProps,
  BadgeProps,
} from "@/components/ui/list";

export type {
  SectionHeaderProps,
  EmptyStateProps,
  DividerProps,
  SpacerProps,
} from "@/components/ui/section";
