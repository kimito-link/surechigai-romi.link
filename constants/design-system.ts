/**
 * デザインシステム定数（後方互換性レイヤー）
 * 
 * 新規コードは @/theme/tokens を直接使用してください。
 * このファイルは既存コードの後方互換性のために維持されています。
 * 
 * @deprecated Use @/theme/tokens instead
 */

import { color, palette, grad } from "@/theme/tokens";
import {
  spacing as layoutSpacing,
  typography as layoutTypography,
  borderRadius as layoutBorderRadius,
  shadows as layoutShadows,
  touchTarget as layoutTouchTarget,
  animation as layoutAnimation,
  zIndex as layoutZIndex,
} from "@/theme/tokens";

// カラーパレット（後方互換性のため既存の構造を維持）
export const colors = {
  // プライマリカラー
  primary: {
    default: color.accentPrimary,
    hover: palette.pink600,
    light: `${color.accentPrimary}26`, // 15% opacity
  },
  // セカンダリカラー
  secondary: {
    default: color.accentAlt,
    hover: palette.purple600,
    light: `${color.accentAlt}26`, // 15% opacity
  },
  // 背景色
  background: {
    primary: color.bg,
    secondary: color.surface,
    tertiary: color.border,
    elevated: "#252830",
  },
  // テキスト色
  text: {
    primary: color.textWhite,
    secondary: color.textSecondary,
    tertiary: "#8B92A0", // hint text - WCAG AA準拠（4.51:1）
    disabled: "#8B92A0", // disabled text - WCAG AA準拠（4.51:1）
  },
  // ボーダー色
  border: {
    default: color.borderAlt,
    light: color.border,
    focus: color.accentPrimary,
  },
  // ステータス色
  status: {
    success: color.success,
    successLight: `${color.success}26`,
    warning: color.warning,
    warningLight: `${color.warning}26`,
    error: color.danger,
    errorLight: `${color.danger}26`,
    info: color.info,
    infoLight: `${color.info}26`,
  },
  // グラデーション
  gradient: {
    primary: grad.pinkPurple,
    secondary: grad.pinkPurpleIndigo,
    success: grad.successGradient,
  },
};

// スペーシング（8pxベース）
export const spacing = layoutSpacing;

// タイポグラフィ
export const typography = layoutTypography;

// ボーダー半径
export const borderRadius = layoutBorderRadius;

// シャドウ
export const shadows = layoutShadows;

// タッチターゲット（Apple HIG準拠）
export const touchTarget = layoutTouchTarget;

// アニメーション
export const animation = layoutAnimation;

// Zインデックス
export const zIndex = layoutZIndex;

// コンポーネント固有のスタイル
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary.default,
      textColor: colors.text.primary,
      borderRadius: borderRadius.lg,
      minHeight: touchTarget.minSize,
    },
    secondary: {
      backgroundColor: colors.background.secondary,
      textColor: colors.text.primary,
      borderColor: colors.border.default,
      borderRadius: borderRadius.lg,
      minHeight: touchTarget.minSize,
    },
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.lg,
  },
};
