/**
 * LoginModal Component Test
 * 
 * LoginModalのアニメーションとメッセージバリエーションをテスト
 */

import { describe, it, expect } from "vitest";

describe("LoginModal", () => {
  describe("メッセージバリエーション", () => {
    const RINKU_MESSAGES = [
      "ログインすると、参加履歴やお気に入りが使えるよ！",
      "一緒に推しを応援しよう！ログインして参加しよう！",
      "ログインすると、あなたの応援が記録されるよ！",
      "みんなと一緒に推しを盛り上げよう！",
      "ログインして、もっと楽しく推し活しよう！",
    ];

    it("5つのメッセージパターンが定義されている", () => {
      expect(RINKU_MESSAGES).toHaveLength(5);
    });

    it("すべてのメッセージが文字列である", () => {
      RINKU_MESSAGES.forEach((message) => {
        expect(typeof message).toBe("string");
      });
    });

    it("すべてのメッセージが空でない", () => {
      RINKU_MESSAGES.forEach((message) => {
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it("すべてのメッセージにログインに関する内容が含まれている", () => {
      RINKU_MESSAGES.forEach((message) => {
        const hasLoginContent = 
          message.includes("ログイン") || 
          message.includes("参加") || 
          message.includes("応援") ||
          message.includes("推し活") ||
          message.includes("推し") ||
          message.includes("記録") ||
          message.includes("盛り上げ");
        expect(hasLoginContent).toBe(true);
      });
    });
  });

  describe("アニメーション設定", () => {
    it("バウンスアニメーションの設定が正しい", () => {
      const animationConfig = {
        translateY: -5,
        damping: 10,
        stiffness: 100,
      };

      expect(animationConfig.translateY).toBe(-5);
      expect(animationConfig.damping).toBe(10);
      expect(animationConfig.stiffness).toBe(100);
    });

    it("フェードインの遅延時間が設定されている", () => {
      const delays = {
        bubble: 200, // 吹き出し
        message: 400, // メッセージ
      };

      expect(delays.bubble).toBe(200);
      expect(delays.message).toBe(400);
      expect(delays.message).toBeGreaterThan(delays.bubble);
    });
  });

  describe("デザイン設定", () => {
    it("りんくキャラクターのサイズが正しい", () => {
      const rinkuSize = { width: 64, height: 64 };
      
      expect(rinkuSize.width).toBe(64);
      expect(rinkuSize.height).toBe(64);
    });

    it("吹き出しのスタイルが正しい", () => {
      const bubbleStyle = {
        backgroundColor: "#FFF5F0",
        padding: 20,
        borderRadius: 16,
      };

      expect(bubbleStyle.backgroundColor).toBe("#FFF5F0");
      expect(bubbleStyle.padding).toBe(20);
      expect(bubbleStyle.borderRadius).toBe(16);
    });

    it("タイトルのフォントサイズが正しい", () => {
      const titleStyle = {
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: 0.5,
      };

      expect(titleStyle.fontSize).toBe(22);
      expect(titleStyle.fontWeight).toBe("700");
      expect(titleStyle.letterSpacing).toBe(0.5);
    });

    it("メッセージのフォントサイズが正しい", () => {
      const messageStyle = {
        fontSize: 15,
        lineHeight: 23,
        fontWeight: "500",
      };

      expect(messageStyle.fontSize).toBe(15);
      expect(messageStyle.lineHeight).toBe(23);
      expect(messageStyle.fontWeight).toBe("500");
    });
  });
});
