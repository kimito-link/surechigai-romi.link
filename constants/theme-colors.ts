/**
 * テーマ対応のカラー定数
 * StyleSheet内で使用するためのカラーマッピング
 */

// ダークテーマの色（現在のデフォルト）
export const DARK_COLORS = {
  background: "#0D1117",
  surface: "#151718",
  surfaceAlt: "#1E2022",
  foreground: "#E6EDF3",
  muted: "#D1D5DB",
  border: "#2D3139",
  primary: "#DD6500",
  primaryHover: "#C55A00",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// ライトテーマの色
export const LIGHT_COLORS = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  surfaceAlt: "#E5E7EB",
  foreground: "#11181C",
  muted: "#687076",
  border: "#E5E7EB",
  primary: "#DD6500",
  primaryHover: "#C55A00",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export type ThemeColors = typeof DARK_COLORS;

/**
 * 色の置換マッピング
 * ハードコードされた色をテーマ変数に置換するためのマッピング
 */
export const COLOR_REPLACEMENTS = {
  // 背景色
  "#0D1117": "background",
  "#151718": "surface",
  "#1E2022": "surfaceAlt",
  
  // テキスト色
  "#E6EDF3": "foreground",
  "#fff": "foreground",
  "#ffffff": "foreground",
  "#FFFFFF": "foreground",
  "#9CA3AF": "muted",
  
  // ボーダー色
  "#2D3139": "border",
  
  // アクセント色
  "#DD6500": "primary",
} as const;
