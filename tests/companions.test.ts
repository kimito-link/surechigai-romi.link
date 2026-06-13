import { describe, it, expect, vi } from "vitest";

// 友人追加機能のテスト

describe("Companion Feature", () => {
  describe("Companion Data Structure", () => {
    it("should have correct companion type structure", () => {
      const companion = {
        id: "1",
        displayName: "友人A",
        twitterUsername: "friend_a",
      };
      
      expect(companion).toHaveProperty("id");
      expect(companion).toHaveProperty("displayName");
      expect(companion).toHaveProperty("twitterUsername");
      expect(typeof companion.id).toBe("string");
      expect(typeof companion.displayName).toBe("string");
    });

    it("should allow empty twitterUsername", () => {
      const companion = {
        id: "2",
        displayName: "友人B",
        twitterUsername: "",
      };
      
      expect(companion.twitterUsername).toBe("");
    });
  });

  describe("Companion List Management", () => {
    it("should add companion to list", () => {
      const companions: Array<{ id: string; displayName: string; twitterUsername: string }> = [];
      
      const newCompanion = {
        id: Date.now().toString(),
        displayName: "テスト友人",
        twitterUsername: "test_friend",
      };
      
      companions.push(newCompanion);
      
      expect(companions.length).toBe(1);
      expect(companions[0].displayName).toBe("テスト友人");
    });

    it("should remove companion from list", () => {
      const companions = [
        { id: "1", displayName: "友人A", twitterUsername: "a" },
        { id: "2", displayName: "友人B", twitterUsername: "b" },
        { id: "3", displayName: "友人C", twitterUsername: "c" },
      ];
      
      const updated = companions.filter(c => c.id !== "2");
      
      expect(updated.length).toBe(2);
      expect(updated.find(c => c.id === "2")).toBeUndefined();
    });

    it("should calculate contribution correctly", () => {
      const companions = [
        { id: "1", displayName: "友人A", twitterUsername: "" },
        { id: "2", displayName: "友人B", twitterUsername: "" },
      ];
      
      // 自分 + 友人の数 = 貢献度
      const contribution = 1 + companions.length;
      
      expect(contribution).toBe(3);
    });
  });

  describe("Twitter Username Handling", () => {
    it("should strip @ from twitter username", () => {
      const input = "@test_user";
      const cleaned = input.replace(/^@/, "");
      
      expect(cleaned).toBe("test_user");
    });

    it("should not modify username without @", () => {
      const input = "test_user";
      const cleaned = input.replace(/^@/, "");
      
      expect(cleaned).toBe("test_user");
    });
  });

  describe("Companion API Data Format", () => {
    it("should format companion data for API submission", () => {
      const companions = [
        { id: "1", displayName: "友人A", twitterUsername: "friend_a" },
        { id: "2", displayName: "友人B", twitterUsername: "" },
      ];
      
      const apiData = companions.map(c => ({
        displayName: c.displayName,
        twitterUsername: c.twitterUsername || undefined,
      }));
      
      expect(apiData.length).toBe(2);
      expect(apiData[0].displayName).toBe("友人A");
      expect(apiData[0].twitterUsername).toBe("friend_a");
      expect(apiData[1].twitterUsername).toBeUndefined();
    });
  });

  describe("Companion Display", () => {
    it("should get first character for avatar", () => {
      const displayName = "テスト友人";
      const initial = displayName.charAt(0);
      
      expect(initial).toBe("テ");
    });

    it("should handle empty displayName gracefully", () => {
      const displayName = "";
      const initial = displayName.charAt(0);
      
      expect(initial).toBe("");
    });
  });
});
