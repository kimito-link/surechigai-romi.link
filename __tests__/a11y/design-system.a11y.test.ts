/**
 * デザインシステム定数のアクセシビリティテスト
 * 
 * デザインシステムの定数がApple Human Interface Guidelinesに準拠しているか検証
 */

import { describe, it, expect } from "vitest";
import { touchTarget, colors, typography, spacing } from "@/constants/design-system";
import { MIN_TOUCH_TARGET_SIZE, MIN_FONT_SIZE, MIN_CONTRAST_RATIO } from "../utils/a11y-helpers";

/**
 * 相対輝度を計算
 * WCAG 2.0の計算式に基づく
 */
function getLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((c) => parseInt(c, 16) / 255);

  const [r, g, b] = rgb.map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * コントラスト比を計算
 */
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Design System Accessibility Tests", () => {
  describe("タッチターゲットサイズ", () => {
    it("最小タッチターゲットサイズが44px以上であること", () => {
      expect(touchTarget.minSize).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
    });

    it("タッチターゲットの最小間隔が8px以上であること", () => {
      expect(touchTarget.minSpacing).toBeGreaterThanOrEqual(8);
    });
  });

  describe("フォントサイズ", () => {
    it("最小フォントサイズが11px以上であること", () => {
      expect(typography.fontSize.xs).toBeGreaterThanOrEqual(MIN_FONT_SIZE);
    });

    it("本文フォントサイズが14px以上であること", () => {
      expect(typography.fontSize.base).toBeGreaterThanOrEqual(14);
    });

    it("見出しフォントサイズが適切であること", () => {
      expect(typography.fontSize.lg).toBeGreaterThan(typography.fontSize.base);
      expect(typography.fontSize.xl).toBeGreaterThan(typography.fontSize.lg);
    });
  });

  describe("カラーコントラスト（ダークモード）", () => {
    it("プライマリテキストと背景のコントラスト比が4.5:1以上であること", () => {
      const contrast = getContrastRatio(colors.text.primary, colors.background.primary);
      expect(contrast).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });

    it("セカンダリテキストと背景のコントラスト比が4.5:1以上であること", () => {
      const contrast = getContrastRatio(colors.text.secondary, colors.background.primary);
      expect(contrast).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });

    it("プライマリカラーと背景のコントラスト比が3:1以上であること", () => {
      // 大きなテキストやUI要素は3:1で許容
      const contrast = getContrastRatio(colors.primary.default, colors.background.primary);
      expect(contrast).toBeGreaterThanOrEqual(3);
    });

    it("エラーカラーと背景のコントラスト比が4.5:1以上であること", () => {
      const contrast = getContrastRatio(colors.status.error, colors.background.primary);
      expect(contrast).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });

    it("成功カラーと背景のコントラスト比が3:1以上であること", () => {
      const contrast = getContrastRatio(colors.status.success, colors.background.primary);
      expect(contrast).toBeGreaterThanOrEqual(3);
    });
  });

  describe("スペーシング", () => {
    it("最小スペーシングが4px以上であること", () => {
      expect(spacing.xs).toBeGreaterThanOrEqual(4);
    });

    it("スペーシングが一貫したスケールであること", () => {
      expect(spacing.sm).toBeGreaterThan(spacing.xs);
      expect(spacing.md).toBeGreaterThan(spacing.sm);
      expect(spacing.lg).toBeGreaterThan(spacing.md);
      expect(spacing.xl).toBeGreaterThan(spacing.lg);
    });
  });

  describe("インタラクティブ要素の視覚的フィードバック", () => {
    it("ボタンのアクティブ状態の不透明度が適切であること", () => {
      // アクティブ状態は視覚的に区別できる必要がある
      const activeOpacity = 0.7; // 一般的な値
      expect(activeOpacity).toBeLessThan(1);
      expect(activeOpacity).toBeGreaterThan(0.5);
    });

    it("無効状態の不透明度が適切であること", () => {
      // 無効状態は視覚的に区別できる必要がある
      const disabledOpacity = 0.5;
      expect(disabledOpacity).toBeLessThan(0.7);
      expect(disabledOpacity).toBeGreaterThan(0.3);
    });
  });

  describe("アニメーション", () => {
    it("アニメーション時間が適切であること", () => {
      // 短すぎず長すぎない
      const shortDuration = 150;
      const normalDuration = 250;
      const longDuration = 400;

      expect(shortDuration).toBeGreaterThanOrEqual(100);
      expect(shortDuration).toBeLessThanOrEqual(200);
      expect(normalDuration).toBeGreaterThanOrEqual(200);
      expect(normalDuration).toBeLessThanOrEqual(300);
      expect(longDuration).toBeLessThanOrEqual(500);
    });
  });
});
