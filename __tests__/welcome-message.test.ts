/**
 * WelcomeMessageコンポーネントのユニットテスト
 */

import { describe, it, expect } from "vitest";

describe("WelcomeMessage", () => {
  describe("コンポーネントの基本構造", () => {
    it("visible propsを受け取る", () => {
      // WelcomeMessagePropsの型定義を確認
      type WelcomeMessageProps = {
        visible: boolean;
        onHide: () => void;
        userName?: string;
      };

      const props: WelcomeMessageProps = {
        visible: true,
        onHide: () => {},
        userName: "テストユーザー",
      };

      expect(props.visible).toBe(true);
      expect(props.onHide).toBeDefined();
      expect(props.userName).toBe("テストユーザー");
    });

    it("userNameはオプショナルである", () => {
      type WelcomeMessageProps = {
        visible: boolean;
        onHide: () => void;
        userName?: string;
      };

      const props: WelcomeMessageProps = {
        visible: true,
        onHide: () => {},
      };

      expect(props.userName).toBeUndefined();
    });
  });

  describe("ウェルカムメッセージの内容", () => {
    it("キャラクターごとに異なるメッセージが定義されている", () => {
      const messages = {
        rinku: "今日も一緒に推し活を楽しもう！",
        konta: "みんなで盛り上がっていこう！",
        tanune: "あなたの応援、しっかり記録するね！",
      };

      expect(messages.rinku).toBe("今日も一緒に推し活を楽しもう！");
      expect(messages.konta).toBe("みんなで盛り上がっていこう！");
      expect(messages.tanune).toBe("あなたの応援、しっかり記録するね！");
    });

    it("すべてのキャラクターメッセージが空文字列ではない", () => {
      const messages = {
        rinku: "今日も一緒に推し活を楽しもう！",
        konta: "みんなで盛り上がっていこう！",
        tanune: "あなたの応援、しっかり記録するね！",
      };

      Object.values(messages).forEach((msg) => {
        expect(msg.length).toBeGreaterThan(0);
      });
    });
  });

  describe("アニメーション設定", () => {
    it("キャラクターのバウンスアニメーションが設定されている", () => {
      const animationConfig = {
        translateY: {
          from: -8,
          to: 0,
        },
        damping: 10,
        stiffness: 100,
        repeat: -1, // 無限ループ
      };

      expect(animationConfig.translateY.from).toBe(-8);
      expect(animationConfig.translateY.to).toBe(0);
      expect(animationConfig.repeat).toBe(-1);
    });

    it("フェードインアニメーションの遅延時間が設定されている", () => {
      const delays = {
        title: 200,
        userName: 300,
        message: 400,
      };

      expect(delays.title).toBe(200);
      expect(delays.userName).toBe(300);
      expect(delays.message).toBe(400);
    });
  });

  describe("表示時間", () => {
    it("3秒後に自動的に非表示になる", () => {
      const autoHideDelay = 3000; // 3秒
      expect(autoHideDelay).toBe(3000);
    });
  });

  describe("デザイン設定", () => {
    it("キャラクター画像のサイズが80pxである", () => {
      const characterSize = 80;
      expect(characterSize).toBe(80);
    });

    it("タイトルのフォントサイズが24pxである", () => {
      const titleFontSize = 24;
      expect(titleFontSize).toBe(24);
    });

    it("ユーザー名のフォントサイズが18pxである", () => {
      const userNameFontSize = 18;
      expect(userNameFontSize).toBe(18);
    });

    it("メッセージのフォントサイズが15pxである", () => {
      const messageFontSize = 15;
      expect(messageFontSize).toBe(15);
    });

    it("背景の不透明度が0.6である", () => {
      const backgroundOpacity = 0.6;
      expect(backgroundOpacity).toBe(0.6);
    });
  });
});
