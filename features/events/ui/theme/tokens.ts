/**
 * Events専用テーマトークン（完成形）
 * 
 * events配下のコンポーネントでは直書き色（#XXXXXX）を使用せず、
 * このトークンを使用することで視認性を保証し、再発を防止する。
 * 一般テキスト色は semantic と揃え、黒背景での可読性を優先。
 * 
 * 使用例:
 * import { eventText, eventFont } from "@/features/events/ui/theme/tokens";
 * <Text style={{ color: eventText.username, fontSize: eventFont.username }}>@{username}</Text>
 */

import { palette } from "@/theme/tokens";

/**
 * テキスト色トークン
 * ダーク背景に対して十分なコントラスト比を確保（semantic と統一）
 */
export const eventText = {
  // 一般テキスト（semantic と同一方針）
  primary: palette.gray100,   // #f5f5f5
  muted: palette.gray200,      // #d4d4d4

  // 特定用途
  username: "#FBBF24",  // @username（視認性強）
  follower: "#F472B6",  // フォロワー数（ピンク）

  // 補助（semantic.textSecondary / textHint と統一）
  secondary: palette.gray200, // #d4d4d4
  hint: palette.gray300,      // #a3a3a3

  // アクセント・強調
  accent: "#D91C81",    // 強調（貢献度など）- WCAG AA準拠
  danger: "#EF4444",    // 削除・警告
} as const;

/**
 * フォントサイズトークン
 * ダークUIでは10px以下は字形が潰れやすいため、12pxを下限とする
 */
export const eventFont = {
  // 小さい文字の下限（視認性保証）
  meta: 12,       // フォロワー数、日付など
  username: 12,   // @username
  
  // 通常サイズ
  body: 14,       // 本文
  title: 16,      // タイトル
  
  // 小さいサイズ（大きいコントラスト色と併用時のみ）
  small: 11,      // バッジ内テキストなど
  tiny: 9,        // 極小（フォロワーバッジなど、高コントラスト色必須）
} as const;

/**
 * UI要素色トークン
 */
export const eventUI = {
  // アバター・アイコンのフォールバック
  fallback: "#D91C81",      // アバター背景 - WCAG AA準拠
  fallbackAlt: "#7C3AED",   // 同伴者アバター背景 - WCAG AA準拠
  
  // アイコン色
  icon: "#D91C81",          // アクセントアイコン - WCAG AA準拠
  iconMuted: "#9CA3AF",     // 補助アイコン（DM、編集など）
  iconDanger: "#EF4444",    // 削除アイコン
  
  // バッジ・ラベル
  badge: "#D91C81",         // バッジ背景 - WCAG AA準拠
  badgeFollower: "#7C3AED", // フォロワーバッジ背景 - WCAG AA準拠
} as const;

/**
 * 型定義
 */
export type EventTextColor = keyof typeof eventText;
export type EventFontSize = keyof typeof eventFont;
export type EventUIColor = keyof typeof eventUI;
