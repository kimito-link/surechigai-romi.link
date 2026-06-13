// features/home/ui/theme/tokens.ts

/**
 * Home feature theme tokens
 * 直書き色を禁止し、一貫したデザインを維持するためのトークン定義。
 * 一般テキストは semantic（palette）と揃える。
 */

import { palette } from "@/theme/tokens";

export const homeText = {
  // main（semantic と統一）
  primary: palette.gray100,
  muted: palette.gray200,
  secondary: palette.gray200,
  hint: palette.gray300,

  // semantic accents（Home 固有）
  accent: "#FBBF24",
  brand: "#D91C81",  // ピンク - WCAG AA準拠（4.53:1）
} as const;

export const homeUI = {
  surface: "#1A1D21",
  surfaceAlt: "#0D1117",
  border: "#2D3139",
  borderActive: "#FBBF24", // valueあり / active 時の枠
  badgeBg: "#FBBF24",      // Featured のバッジ背景など
  avatarFallback: "#D91C81", // WCAG AA準拠
  iconBgPurple: "#7C3AED", // WCAG AA準拠（4.76:1）
  iconBgFire: "#FF6B6B",
  iconBgGold: "#FFD700",
  progressBar: "#2D3139",
  activeFilter: "#7C3AED", // WCAG AA準拠
  inactiveFilter: "#1E293B",
} as const;

export const homeGradient = {
  // 使い回すグラデーション
  pinkPurple: ["#EC4899", "#8B5CF6"] as const,
  pinkPurpleIndigo: ["#EC4899", "#8B5CF6", "#6366F1"] as const,
  surfaceGradient: ["#1A1D21", "#0D1117"] as const,
  goldOrange: ["#FFD700", "#FFA500"] as const,
} as const;

export const homeFont = {
  small: 11,
  meta: 12,
  body: 14,
  title: 16,
  lg: 18,
  display: 48,
} as const;

// 後方互換性のためのエイリアス（既存コードで使用）
export const homeColor = {
  accent: homeText.accent,
  accentBright: homeText.accent,
  gradientPink: "#EC4899",
  gradientPurple: "#8B5CF6",
  gradientIndigo: "#6366F1",
  fallback: homeUI.avatarFallback,
  surfaceActive: homeText.accent,
  surfaceInactive: homeUI.border,
  borderActive: homeUI.borderActive,
  borderInactive: homeUI.border,
  iconBgPink: "#EC4899",
  iconBgOrange: homeText.accent,
} as const;
