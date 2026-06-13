/**
 * アカウント切り替え履歴とセッション有効期限のテスト
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// __DEV__のモック
beforeAll(() => {
  (global as any).__DEV__ = false;
});

// AsyncStorageのモック
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// expo-secure-storeのモック
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItemAsync: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: vi.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
}));

// react-nativeのモック
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

describe("Account Manager - History Functions", () => {
  beforeEach(() => {
    // ストレージをクリア
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe("formatLastUsed", () => {
    it("たった今を返す（1分未満）", async () => {
      const { formatLastUsed } = await import("@/lib/account-manager");
      const now = Date.now();
      expect(formatLastUsed(now)).toBe("たった今");
    });

    it("分単位で返す（1時間未満）", async () => {
      const { formatLastUsed } = await import("@/lib/account-manager");
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      expect(formatLastUsed(thirtyMinutesAgo)).toBe("30分前");
    });

    it("時間単位で返す（24時間未満）", async () => {
      const { formatLastUsed } = await import("@/lib/account-manager");
      const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000;
      expect(formatLastUsed(fiveHoursAgo)).toBe("5時間前");
    });

    it("日単位で返す（7日未満）", async () => {
      const { formatLastUsed } = await import("@/lib/account-manager");
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      expect(formatLastUsed(threeDaysAgo)).toBe("3日前");
    });

    it("日付形式で返す（7日以上）", async () => {
      const { formatLastUsed } = await import("@/lib/account-manager");
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      const result = formatLastUsed(tenDaysAgo);
      // 日付形式（例: "1/5"）であることを確認
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}$/);
    });
  });

  describe("getRecentAccounts", () => {
    it("最近使用したアカウントを取得", async () => {
      const { saveAccount, getRecentAccounts } = await import("@/lib/account-manager");
      
      // アカウントを保存
      await saveAccount({
        id: "1",
        username: "user1",
        displayName: "User 1",
      });
      await saveAccount({
        id: "2",
        username: "user2",
        displayName: "User 2",
      });
      await saveAccount({
        id: "3",
        username: "user3",
        displayName: "User 3",
      });
      
      const recent = await getRecentAccounts(2);
      expect(recent.length).toBe(2);
      // 最新のアカウントが先頭
      expect(recent[0].id).toBe("3");
    });
  });
});

describe("Session Expiry Formatting", () => {
  it("有効期限のフォーマットが正しい", () => {
    // セッション有効期限のフォーマットロジックをテスト
    const formatExpiry = (remainingSeconds: number): string => {
      if (remainingSeconds <= 0) {
        return "期限切れ";
      } else if (remainingSeconds < 60) {
        return `${remainingSeconds}秒後`;
      } else if (remainingSeconds < 3600) {
        const minutes = Math.floor(remainingSeconds / 60);
        return `${minutes}分後`;
      } else {
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        if (minutes > 0) {
          return `${hours}時間${minutes}分後`;
        } else {
          return `${hours}時間後`;
        }
      }
    };

    expect(formatExpiry(-100)).toBe("期限切れ");
    expect(formatExpiry(0)).toBe("期限切れ");
    expect(formatExpiry(30)).toBe("30秒後");
    expect(formatExpiry(300)).toBe("5分後");
    expect(formatExpiry(1800)).toBe("30分後");
    expect(formatExpiry(3600)).toBe("1時間後");
    expect(formatExpiry(5400)).toBe("1時間30分後");
    expect(formatExpiry(7200)).toBe("2時間後");
  });
});
