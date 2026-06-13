// features/create/ui/components/create-challenge-form/types.ts
// 型定義

import type { CreateChallengeState, ValidationError } from "../../../hooks/use-create-challenge";
import type { RefObject } from "react";
import type { View } from "react-native";
import type { ChallengePreset } from "@/constants/challenge-presets";

/**
 * カテゴリデータの型
 */
export type CategoryData = {
  id: number;
  name: string;
  emoji?: string | null;
};

/**
 * CreateChallengeFormのProps
 */
export type CreateChallengeFormProps = {
  state: CreateChallengeState;
  updateField: <K extends keyof CreateChallengeState>(field: K, value: CreateChallengeState[K]) => void;
  handleGoalTypeChange: (id: string, unit: string) => void;
  applyPreset?: (preset: ChallengePreset) => void;
  handleCreate: () => void;
  validationErrors: ValidationError[];
  isPending: boolean;
  categoriesData?: CategoryData[];
  isCategoriesLoading?: boolean;
  isDesktop: boolean;
  titleInputRef: RefObject<View | null>;
  dateInputRef: RefObject<View | null>;
  /** 未ログイン時のバリデーションでスクロール先にするref */
  loginSectionRef?: RefObject<View | null>;
  /** 未ログイン時のログイン開始（共通LoginModalを開く）。未指定時は useAuth().login */
  onLoginOpen?: () => void;
};

/**
 * Twitterログインセクションのprops
 */
export type TwitterLoginSectionProps = {
  onLogin: () => void;
  /** バリデーションエラー時に吹き出しで表示 */
  showHostError?: boolean;
  /** ラップ用ref（スクロール先） */
  innerRef?: RefObject<View | null>;
};

/**
 * ユーザー情報表示セクションのprops
 */
export type UserInfoSectionProps = {
  user: {
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    followersCount?: number | null;
    description?: string | null;
  };
};

/**
 * タイトル入力セクションのprops
 */
export type TitleInputSectionProps = {
  value: string;
  onChange: (value: string) => void;
  showValidationError: boolean;
  inputRef: RefObject<View | null>;
};

/**
 * 日付入力セクションのprops
 */
export type DateInputSectionProps = {
  value: string;
  onChange: (value: string) => void;
  showValidationError: boolean;
  inputRef: RefObject<View | null>;
};

/**
 * 会場入力セクションのprops
 */
export type VenueInputSectionProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * 外部URL入力セクションのprops
 */
export type ExternalUrlSectionProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * 説明入力セクションのprops
 */
export type DescriptionSectionProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * 作成ボタンセクションのprops
 */
export type CreateButtonSectionProps = {
  onPress: () => void;
  isPending: boolean;
};

/**
 * テンプレートリンクセクションのprops
 */
export type TemplateLinksectionProps = {
  onPress: () => void;
};

// Re-export for convenience
export type { CreateChallengeState, ValidationError };
