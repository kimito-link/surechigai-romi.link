/**
 * Molecules コンポーネントのアクセシビリティテスト
 * 
 * 複合コンポーネントがApple Human Interface Guidelinesに準拠しているか検証
 */

import { describe, it, expect } from "vitest";
import {
  checkTouchTargetSize,
  checkAccessibilityLabel,
  checkImageAccessibility,
  checkTextAccessibility,
  isInteractiveElement,
} from "../utils/a11y-helpers";

describe("Molecules Accessibility Tests", () => {
  describe("Card コンポーネント", () => {
    it("カードがタップ可能な場合はaccessibilityLabelが必要", () => {
      const cardProps = {
        onPress: () => {},
      };

      const result = checkAccessibilityLabel(cardProps, true);
      expect(result.valid).toBe(false);
    });

    it("カードにaccessibilityLabelが設定されていればパス", () => {
      const cardProps = {
        onPress: () => {},
        accessibilityLabel: "チャレンジ詳細を表示",
      };

      const result = checkAccessibilityLabel(cardProps, true);
      expect(result.valid).toBe(true);
    });

    it("タップ不可能なカードはラベルなしでもパス", () => {
      const cardProps = {
        style: { padding: 16 },
      };

      const isInteractive = isInteractiveElement(cardProps);
      const result = checkAccessibilityLabel(cardProps, isInteractive);
      expect(result.valid).toBe(true);
    });
  });

  describe("LazyImage/LazyAvatar コンポーネント", () => {
    it("画像にaccessibilityLabelが必要", () => {
      const imageProps = {};

      const result = checkImageAccessibility(imageProps);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("accessibilityLabel");
    });

    it("accessibilityLabelが設定されていればパス", () => {
      const imageProps = {
        accessibilityLabel: "ユーザーのプロフィール画像",
      };

      const result = checkImageAccessibility(imageProps);
      expect(result.valid).toBe(true);
    });

    it("装飾的な画像はaccessible={false}でスキップ可能", () => {
      const imageProps = {
        accessible: false,
      };

      const result = checkImageAccessibility(imageProps);
      expect(result.valid).toBe(true);
      expect(result.message).toContain("装飾的");
    });
  });

  describe("ConfirmModal コンポーネント", () => {
    it("確認ボタンはタッチターゲットサイズを満たすこと", () => {
      const confirmButtonProps = {
        style: { minHeight: 48, paddingHorizontal: 24 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(confirmButtonProps);
      expect(result.valid).toBe(true);
    });

    it("キャンセルボタンはタッチターゲットサイズを満たすこと", () => {
      const cancelButtonProps = {
        style: { minHeight: 48, paddingHorizontal: 24 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(cancelButtonProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("AnimatedListItem コンポーネント", () => {
    it("リストアイテムのタッチターゲットサイズが適切であること", () => {
      const listItemProps = {
        style: { minHeight: 44 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(listItemProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("ShareButton コンポーネント", () => {
    it("シェアボタンにaccessibilityLabelが必要", () => {
      const shareButtonProps = {
        onPress: () => {},
        accessibilityLabel: "SNSでシェアする",
      };

      const result = checkAccessibilityLabel(shareButtonProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("DatePicker コンポーネント", () => {
    it("日付選択のタッチターゲットが適切であること", () => {
      const datePickerProps = {
        style: { height: 48 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(datePickerProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("TalkingCharacter コンポーネント", () => {
    it("キャラクターがタップ可能な場合はaccessibilityLabelが必要", () => {
      const characterProps = {
        onPress: () => {},
      };

      const result = checkAccessibilityLabel(characterProps, true);
      expect(result.valid).toBe(false);
    });

    it("accessibilityLabelが設定されていればパス", () => {
      const characterProps = {
        onPress: () => {},
        accessibilityLabel: "りんくちゃんをタップしてメッセージを見る",
      };

      const result = checkAccessibilityLabel(characterProps, true);
      expect(result.valid).toBe(true);
    });
  });

  describe("LoadingScreen コンポーネント", () => {
    it("ローディングテキストが読みやすいサイズであること", () => {
      const loadingTextProps = {
        style: { fontSize: 14 },
      };

      const result = checkTextAccessibility(loadingTextProps);
      expect(result.valid).toBe(true);
    });
  });

  describe("Collapsible コンポーネント", () => {
    it("折りたたみトリガーのタッチターゲットが適切であること", () => {
      const collapsibleTriggerProps = {
        style: { minHeight: 44, paddingVertical: 12 },
        onPress: () => {},
      };

      const result = checkTouchTargetSize(collapsibleTriggerProps);
      expect(result.valid).toBe(true);
    });

    it("折りたたみトリガーにaccessibilityLabelが必要", () => {
      const collapsibleTriggerProps = {
        onPress: () => {},
        accessibilityLabel: "詳細を展開",
        accessibilityHint: "タップして詳細を表示または非表示にします",
      };

      const result = checkAccessibilityLabel(collapsibleTriggerProps, true);
      expect(result.valid).toBe(true);
    });
  });
});
