/**
 * テーマ対応のカラー定数
 * ハードコードされた色をテーマ変数に置き換えるためのユーティリティ
 */

import { SchemeColors, type ColorScheme } from "@/lib/_core/theme";

/**
 * テーマに応じた色を取得
 */
export function getThemedColor(colorScheme: ColorScheme, token: keyof typeof SchemeColors.light): string {
  return SchemeColors[colorScheme][token];
}

/**
 * テーマに応じた背景色を取得
 */
export function getBackgroundColor(colorScheme: ColorScheme): string {
  return SchemeColors[colorScheme].background;
}

/**
 * テーマに応じたサーフェス色を取得
 */
export function getSurfaceColor(colorScheme: ColorScheme): string {
  return SchemeColors[colorScheme].surface;
}

/**
 * テーマに応じたテキスト色を取得
 */
export function getForegroundColor(colorScheme: ColorScheme): string {
  return SchemeColors[colorScheme].foreground;
}

/**
 * テーマに応じたミュート色を取得
 */
export function getMutedColor(colorScheme: ColorScheme): string {
  return SchemeColors[colorScheme].muted;
}

/**
 * テーマに応じたボーダー色を取得
 */
export function getBorderColor(colorScheme: ColorScheme): string {
  return SchemeColors[colorScheme].border;
}

/**
 * 静的なダークモード色（レガシー互換用）
 * 新規コードではuseColors()フックを使用してください
 */
export const DARK_COLORS = {
  background: "#0D1117",
  surface: "#161B22",
  foreground: "#E6EDF3",
  muted: "#8B949E",
  border: "#30363D",
  primary: "#4A90D9",
  accent: "#FF8C33",
} as const;

/**
 * 静的なライトモード色（レガシー互換用）
 * 新規コードではuseColors()フックを使用してください
 */
export const LIGHT_COLORS = {
  background: "#ffffff",
  surface: "#F8F9FA",
  foreground: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  primary: "#00427B",
  accent: "#DD6500",
} as const;
