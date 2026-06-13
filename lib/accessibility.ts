import { AccessibilityInfo, Platform } from "react-native";

/**
 * アクセシビリティユーティリティ
 * 
 * UI/UXガイドに基づく設計:
 * - WCAG準拠: コントラスト比、代替テキスト
 * - スクリーンリーダー対応: 適切なラベル
 * - 動作設定: 減少モーション対応
 */

// コントラスト比を計算
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// HEXをRGBに変換
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// WCAG AA基準を満たすかチェック
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// WCAG AAA基準を満たすかチェック
export function meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// アクセシビリティプロパティを生成
export function createAccessibilityProps(options: {
  label: string;
  hint?: string;
  role?: "button" | "link" | "header" | "image" | "text" | "none";
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    expanded?: boolean;
    busy?: boolean;
  };
}) {
  const { label, hint, role, state } = options;

  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessibilityState: state,
  };
}

// スクリーンリーダーが有効かチェック
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

// 減少モーションが有効かチェック
export async function isReduceMotionEnabled(): Promise<boolean> {
  if (Platform.OS === "web") {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }
  return AccessibilityInfo.isReduceMotionEnabled();
}

// アクセシビリティアナウンスメント
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

// 推奨されるフォントサイズを取得
export function getRecommendedFontSize(baseSize: number): number {
  // 最小フォントサイズは12px
  return Math.max(baseSize, 12);
}

// タッチターゲットサイズの検証
export function validateTouchTarget(width: number, height: number): {
  valid: boolean;
  message?: string;
} {
  const MIN_SIZE = 44; // Apple HIG

  if (width < MIN_SIZE || height < MIN_SIZE) {
    return {
      valid: false,
      message: `タッチターゲットが小さすぎます。最小サイズは${MIN_SIZE}x${MIN_SIZE}pxです。現在: ${width}x${height}px`,
    };
  }

  return { valid: true };
}
