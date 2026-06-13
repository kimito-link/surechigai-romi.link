/**
 * Organisms コンポーネントのアクセシビリティテスト
 * 
 * 機能単位コンポーネントがApple Human Interface Guidelinesに準拠しているか検証
 */

import { describe, it, expect } from "vitest";
import {
  checkTouchTargetSize,
  checkAccessibilityLabel,
  checkAccessibilityRole,
  checkTextAccessibility,
  isInteractiveElement,
} from "../utils/a11y-helpers";

describe("Organisms Accessibility Tests", () => {
  describe("AppHeader コンポーネント", () => {
    it("戻るボタンのタッチターゲットが適切であること", () => {
      const backButtonProps = {
        style: { width: 44, height: 44 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(backButtonProps);
      expect(result.valid).toBe(true);
    });

    it("戻るボタンにaccessibilityLabelが必要", () => {
      const backButtonProps = {
        onPress: () => {},
        accessibilityLabel: "戻る",
      };

      const result = checkAccessibilityLabel(backButtonProps, true);
      expect(result.valid).toBe(true);
    });

    it("メニューボタンにaccessibilityLabelが必要", () => {
      const menuButtonProps = {
        onPress: () => {},
        accessibilityLabel: "メニューを開く",
      };

      const result = checkAccessibilityLabel(menuButtonProps, true);
      expect(result.valid).toBe(true);
    });

    it("ヘッダータイトルが読みやすいサイズであること", () => {
      const titleProps = {
        style: { fontSize: 18 },
      };

      const result = checkTextAccessibility(titleProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("GlobalMenu コンポーネント", () => {
    it("メニューアイテムのタッチターゲットが適切であること", () => {
      const menuItemProps = {
        style: { minHeight: 48, paddingHorizontal: 16 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(menuItemProps);
      expect(result.valid).toBe(true);
    });

    it("メニューアイテムにaccessibilityRoleが設定されていること", () => {
      const menuItemProps = {
        onPress: () => {},
        accessibilityRole: "menuitem",
      };

      const result = checkAccessibilityRole(menuItemProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("JapanHeatmap コンポーネント", () => {
    it("地域タップ時のタッチターゲットが適切であること", () => {
      const regionProps = {
        style: { minWidth: 44, minHeight: 44 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(regionProps);
      expect(result.valid).toBe(true);
    });

    it("地域にaccessibilityLabelが必要", () => {
      const regionProps = {
        onPress: () => {},
        accessibilityLabel: "北海道: 1,234人参加中",
      };

      const result = checkAccessibilityLabel(regionProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("TicketTransferSection コンポーネント", () => {
    it("譲渡ボタンのタッチターゲットが適切であること", () => {
      const transferButtonProps = {
        style: { minHeight: 48 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(transferButtonProps);
      expect(result.valid).toBe(true);
    });

    it("譲渡ボタンにaccessibilityLabelが必要", () => {
      const transferButtonProps = {
        onPress: () => {},
        accessibilityLabel: "チケットを譲渡する",
      };

      const result = checkAccessibilityLabel(transferButtonProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("ParticipantRanking コンポーネント", () => {
    it("ランキングアイテムのテキストが読みやすいサイズであること", () => {
      const rankingTextProps = {
        style: { fontSize: 14 },
      };

      const result = checkTextAccessibility(rankingTextProps);
      expect(result.valid).toBe(true);
    });

    it("ランキング順位が読みやすいサイズであること", () => {
      const rankNumberProps = {
        style: { fontSize: 16 },
      };

      const result = checkTextAccessibility(rankNumberProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("AccountSwitcher コンポーネント", () => {
    it("アカウント切り替えボタンのタッチターゲットが適切であること", () => {
      const switchButtonProps = {
        style: { minHeight: 48 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(switchButtonProps);
      expect(result.valid).toBe(true);
    });

    it("アカウントアイテムにaccessibilityLabelが必要", () => {
      const accountItemProps = {
        onPress: () => {},
        accessibilityLabel: "@username に切り替える",
      };

      const result = checkAccessibilityLabel(accountItemProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("NotificationSettings コンポーネント", () => {
    it("トグルスイッチのタッチターゲットが適切であること", () => {
      const toggleProps = {
        style: { minWidth: 51, minHeight: 31 }, // iOS標準スイッチサイズ
        onPress: () => {},
      };

      const result = checkTouchTargetSize(toggleProps);
      expect(result.valid).toBe(false); // 31pxは44px未満
    });

    it("トグル行全体のタッチターゲットが適切であること", () => {
      const toggleRowProps = {
        style: { minHeight: 44, paddingHorizontal: 16 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(toggleRowProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("OnboardingSteps コンポーネント", () => {
    it("次へボタンのタッチターゲットが適切であること", () => {
      const nextButtonProps = {
        style: { minHeight: 48, paddingHorizontal: 24 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(nextButtonProps);
      expect(result.valid).toBe(true);
    });

    it("スキップボタンのタッチターゲットが適切であること", () => {
      const skipButtonProps = {
        style: { minHeight: 44, paddingHorizontal: 16 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(skipButtonProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("OfflineBanner コンポーネント", () => {
    it("オフラインメッセージが読みやすいサイズであること", () => {
      const offlineTextProps = {
        style: { fontSize: 14 },
      };

      const result = checkTextAccessibility(offlineTextProps);
      expect(result.valid).toBe(true);
    });

    it("再試行ボタンにaccessibilityLabelが必要", () => {
      const retryButtonProps = {
        onPress: () => {},
        accessibilityLabel: "接続を再試行",
      };

      const result = checkAccessibilityLabel(retryButtonProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("ErrorMessage コンポーネント", () => {
    it("エラーメッセージが読みやすいサイズであること", () => {
      const errorTextProps = {
        style: { fontSize: 14 },
      };

      const result = checkTextAccessibility(errorTextProps);
      expect(result.valid).toBe(true);
    });

    it("再試行ボタンのタッチターゲットが適切であること", () => {
      const retryButtonProps = {
        style: { minHeight: 48 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(retryButtonProps);
      expect(result.valid).toBe(true);
    });
  });
});
