/**
 * Atoms コンポーネントのアクセシビリティテスト
 * 
 * 基本UI要素がApple Human Interface Guidelinesに準拠しているか検証
 */

import { describe, it, expect } from "vitest";
import {
  MIN_TOUCH_TARGET_SIZE,
  MIN_FONT_SIZE,
  checkTouchTargetSize,
  checkAccessibilityLabel,
  checkAccessibilityRole,
  checkTextAccessibility,
  isInteractiveElement,
} from "../utils/a11y-helpers";

describe("Atoms Accessibility Tests", () => {
  describe("Button コンポーネント", () => {
    it("タッチターゲットサイズが最小44x44pxを満たすこと", () => {
      // Button コンポーネントのデフォルトスタイル
      const buttonProps = {
        style: { minHeight: 48, paddingHorizontal: 16 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(buttonProps);
      expect(result.valid).toBe(true);
    });

    it("onPressを持つ要素はインタラクティブと判定されること", () => {
      const buttonProps = { onPress: () => {} };
      expect(isInteractiveElement(buttonProps)).toBe(true);
    });

    it("accessibilityLabelが設定されている場合はパスすること", () => {
      const buttonProps = {
        onPress: () => {},
        accessibilityLabel: "送信ボタン",
      };

      const result = checkAccessibilityLabel(buttonProps, true);
      expect(result.valid).toBe(true);
    });

    it("accessibilityHintが設定されている場合はパスすること", () => {
      const buttonProps = {
        onPress: () => {},
        accessibilityHint: "フォームを送信します",
      };

      const result = checkAccessibilityLabel(buttonProps, true);
      expect(result.valid).toBe(true);
    });

    it("インタラクティブ要素にラベルがない場合は警告すること", () => {
      const buttonProps = { onPress: () => {} };

      const result = checkAccessibilityLabel(buttonProps, true);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("accessibilityLabel");
    });
  });

  describe("Input コンポーネント", () => {
    it("タッチターゲットサイズが適切であること", () => {
      const inputProps = {
        style: { height: 48, paddingHorizontal: 16 },
      };

      const result = checkTouchTargetSize(inputProps);
      expect(result.valid).toBe(true);
    });

    it("小さすぎるタッチターゲットは検出されること", () => {
      const inputProps = {
        style: { height: 30, width: 100 },
      };

      const result = checkTouchTargetSize(inputProps);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("小さすぎます");
    });
  });

  describe("Text コンポーネント", () => {
    it("適切なフォントサイズ（11px以上）はパスすること", () => {
      const textProps = {
        style: { fontSize: 14 },
      };

      const result = checkTextAccessibility(textProps);
      expect(result.valid).toBe(true);
    });

    it("小さすぎるフォントサイズは検出されること", () => {
      const textProps = {
        style: { fontSize: 10 },
      };

      const result = checkTextAccessibility(textProps);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("小さすぎます");
    });

    it("フォントサイズが指定されていない場合はパスすること", () => {
      const textProps = {
        style: { color: "#000" },
      };

      const result = checkTextAccessibility(textProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("IconSymbol コンポーネント", () => {
    it("アイコンのみの場合はaccessibilityLabelが必要", () => {
      const iconProps = {
        onPress: () => {},
      };

      const result = checkAccessibilityLabel(iconProps, true);
      expect(result.valid).toBe(false);
    });

    it("accessibilityLabelが設定されていればパス", () => {
      const iconProps = {
        onPress: () => {},
        accessibilityLabel: "メニューを開く",
      };

      const result = checkAccessibilityLabel(iconProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("Touchable コンポーネント", () => {
    it("最小タッチターゲットサイズ（44x44px）を満たすこと", () => {
      // Touchableコンポーネントのデフォルトスタイル
      const touchableProps = {
        style: { minWidth: 44, minHeight: 44 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(touchableProps);
      expect(result.valid).toBe(true);
    });

    it("accessibilityRoleが推奨されること", () => {
      const touchableProps = {
        onPress: () => {},
      };

      const result = checkAccessibilityRole(touchableProps, true);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("accessibilityRole");
    });

    it("accessibilityRoleが設定されていればパス", () => {
      const touchableProps = {
        onPress: () => {},
        accessibilityRole: "button",
      };

      const result = checkAccessibilityRole(touchableProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("Badge コンポーネント", () => {
    it("バッジのテキストが読みやすいサイズであること", () => {
      const badgeProps = {
        style: { fontSize: 12 },
      };

      const result = checkTextAccessibility(badgeProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("定数値の検証", () => {
    it("MIN_TOUCH_TARGET_SIZEが44pxであること", () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });

    it("MIN_FONT_SIZEが11pxであること", () => {
      expect(MIN_FONT_SIZE).toBe(11);
    });
  });
});
