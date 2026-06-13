/**
 * マイページ用カラートークン
 * 
 * 直書き色を一元管理し、テーマ変更を容易にする。
 * 一般テキストは semantic（palette）と統一。
 */

import { palette } from "@/theme/tokens";

// UI要素色
export const mypageUI = {
  // カード背景・ボーダー
  cardBg: "#1A1D21",
  cardBorder: "#2D3139",
  
  // ボタン
  twitterBg: "#1DA1F2",
  switchAccountBg: "#1E293B",
  patternActiveBg: "#EC4899",
  patternInactiveBg: "#3D4148",
  
  // 主催バッジ
  hostBadgeBg: "#DD6500",
  hostBorder: "#DD6500",
} as const;

// テキスト色（muted は semantic と統一）
export const mypageText = {
  muted: palette.gray200,
  mutedLight: palette.gray100,

  // 統計数値（マイページ固有）
  statPink: "#EC4899",
  statPurple: "#8B5CF6",
  statOrange: "#DD6500",

  // アクション
  switchAccount: "#93C5FD",
  logout: "#EF4444",
} as const;

// グラデーション色
export const mypageGradient = {
  // プロフィールカードヘッダー
  profileHeader: ["#EC4899", "#8B5CF6"] as const,
  
  // ログイン画面背景
  loginBg: ["#1a237e", "#0D1117"] as const,
  
  // ログインパターン（キャラクター別）
  linkPink: ["#EC4899", "#8B5CF6"] as const,
  linkPurple: ["#8B5CF6", "#3B82F6"] as const,
  kontaOrange: ["#F59E0B", "#EF4444"] as const,
  kontaGold: ["#DD6500", "#F59E0B"] as const,
  tanuneGreen: ["#10B981", "#3B82F6"] as const,
  tanunePink: ["#EC4899", "#F43F5E"] as const,
} as const;

// キャラクターアクセント色
export const mypageAccent = {
  linkPink: "#EC4899",
  linkPurple: "#8B5CF6",
  kontaOrange: "#F59E0B",
  kontaGold: "#DD6500",
  tanuneGreen: "#10B981",
  tanunePink: "#F43F5E",
} as const;

// フォントサイズ（TOKENS_INVENTORY 方針: meta=12, body=14, title=16）
export const mypageFont = {
  meta: 12,
  body: 14,
  title: 16,
  lg: 20,
  xl: 24,
  display: 32,
} as const;
