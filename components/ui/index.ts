// components/ui/index.ts
// v6.19: 統一されたUIコンポーネント

// Button系
export { 
  Button, 
  IconButton, 
  FAB,
  type ButtonProps,
  type IconButtonProps,
  type FABProps,
  type ButtonVariant,
  type ButtonSize,
} from "./button";

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
  type CardVariant,
  type CardPadding,
} from "./card";

// Modal系
export { 
  Modal, 
  ConfirmModal, 
  AlertModal,
  type ModalProps,
  type ConfirmModalProps,
  type AlertModalProps,
} from "./modal";

// Section系
export { 
  SectionHeader, 
  EmptyState, 
  Divider, 
  Spacer,
  type SectionHeaderProps,
  type EmptyStateProps,
  type DividerProps,
  type SpacerProps,
} from "./section";

// Input系
export { 
  Input, 
  SearchInput,
  type InputProps,
  type SearchInputProps,
} from "./input";

// Checkbox系
export {
  Checkbox,
  type CheckboxProps,
} from "./checkbox";

// List系
export { 
  ListItem, 
  Avatar, 
  Badge,
  type ListItemProps,
  type AvatarProps,
  type BadgeProps,
} from "./list";

// ErrorBoundary系
export {
  ErrorBoundary,
  type ErrorBoundaryProps,
  type FallbackProps,
} from "./error-boundary";

export {
  MapErrorBoundary,
  type MapErrorBoundaryProps,
} from "./map-error-boundary";

export {
  MapErrorFallback,
  type MapErrorFallbackProps,
} from "./map-error-fallback";

// Screen States
export {
  ScreenLoadingState,
  type ScreenLoadingStateProps,
} from "./screen-loading-state";
export {
  ScreenErrorState,
  type ScreenErrorStateProps,
} from "./screen-error-state";
export { InlineErrorBar, type InlineErrorBarProps } from "./inline-error-bar";

// RetryButton系
export {
  RetryButton,
  type RetryButtonProps,
} from "./retry-button";

// Selector系
export {
  PrefectureSelector,
  type PrefectureSelectorProps,
} from "./prefecture-selector";

export {
  GenderSelector,
  type GenderSelectorProps,
  type FormGender,
} from "./gender-selector";

// Display系
export {
  ContributionDisplay,
  type ContributionDisplayProps,
} from "./contribution-display";

export {
  CharacterIconRow,
  type CharacterIconRowProps,
  type CharacterIconConfig,
} from "./character-icon-row";

export {
  CharacterDetailModal,
  type CharacterDetailModalProps,
  type CharacterInfo,
} from "./character-detail-modal";
