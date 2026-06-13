/**
 * LoginModal A/Bテスト機能のユニットテスト
 */

import { describe, it, expect } from "vitest";
import { LOGIN_MESSAGES, getRandomLoginMessage } from "@/constants/login-messages";

describe("LoginModal A/Bテスト機能", () => {
  describe("LOGIN_MESSAGES", () => {
    it("5つのメッセージバリエーションが定義されている", () => {
      expect(LOGIN_MESSAGES).toHaveLength(5);
    });

    it("すべてのメッセージに必須フィールドが含まれている", () => {
      LOGIN_MESSAGES.forEach((msg) => {
        expect(msg).toHaveProperty("id");
        expect(msg).toHaveProperty("character");
        expect(msg).toHaveProperty("role");
        expect(msg).toHaveProperty("message");
        expect(msg).toHaveProperty("characterImagePath");
      });
    });

    it("りんくのメッセージが2つ含まれている", () => {
      const rinkuMessages = LOGIN_MESSAGES.filter((msg) => msg.character === "rinku");
      expect(rinkuMessages).toHaveLength(2);
    });

    it("こん太のメッセージが2つ含まれている", () => {
      const kontaMessages = LOGIN_MESSAGES.filter((msg) => msg.character === "konta");
      expect(kontaMessages).toHaveLength(2);
    });

    it("たぬ姉のメッセージが1つ含まれている", () => {
      const tanuneMessages = LOGIN_MESSAGES.filter((msg) => msg.character === "tanune");
      expect(tanuneMessages).toHaveLength(1);
    });

    it("すべてのメッセージIDがユニークである", () => {
      const ids = LOGIN_MESSAGES.map((msg) => msg.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("すべてのメッセージが空文字列ではない", () => {
      LOGIN_MESSAGES.forEach((msg) => {
        expect(msg.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getRandomLoginMessage", () => {
    it("ランダムにメッセージを返す", () => {
      const message = getRandomLoginMessage();
      expect(message).toBeDefined();
      expect(LOGIN_MESSAGES).toContain(message);
    });

    it("複数回呼び出してもエラーが発生しない", () => {
      for (let i = 0; i < 10; i++) {
        const message = getRandomLoginMessage();
        expect(message).toBeDefined();
      }
    });

    it("返されるメッセージがLOGIN_MESSAGESに含まれている", () => {
      const message = getRandomLoginMessage();
      const found = LOGIN_MESSAGES.some((msg) => msg.id === message.id);
      expect(found).toBe(true);
    });
  });
});
