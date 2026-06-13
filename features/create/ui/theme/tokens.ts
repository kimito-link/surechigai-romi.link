/**
 * チャレンジ作成画面用カラートークン
 * 
 * 直書き色を一元管理し、テーマ変更を容易にする。
 * テキスト補助色は semantic（palette）と統一。
 */

import { palette } from "@/theme/tokens";

// UI要素色
export const createUI = {
  // 入力フィールド
  inputBg: "#1A1D21",           // 入力フィールド背景
  inputBorder: "#2D3139",       // 入力フィールドボーダー
  
  // チェックボックス・トグル
  checkboxBorder: "#6B7280",    // 非選択時のボーダー
  checkboxActiveBorder: "#4B5563", // アクティブ時のボーダー（暗め）
  
  // アクセント色
  activeAccent: "#D91C81",      // ピンク（選択状態）- WCAG AA準拠
  purpleAccent: "#7C3AED",      // 紫（テンプレート保存）- WCAG AA準拠
  successAccent: "#22C55E",     // 緑（公開設定）
} as const;

// テキスト色（semantic.textHint と統一）
export const createText = {
  placeholder: palette.gray300,
  muted: palette.gray300,
  accent: "#D91C81",   // アクセント（選択状態）- WCAG AA準拠
  purple: "#7C3AED",   // 紫 - WCAG AA準拠
  success: "#22C55E",
} as const;

// フォントサイズ（TOKENS_INVENTORY 方針: meta=12, body=14, title=16）
export const createFont = {
  meta: 12,
  body: 14,
  title: 16,
  lg: 20,
} as const;
