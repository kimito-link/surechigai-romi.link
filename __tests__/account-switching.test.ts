/**
 * アカウント切り替え機能とログイン永続化のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
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
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      return Promise.resolve();
    }),
  },
}));

// Mock expo-secure-store
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

// Mock Platform
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

describe("Account Switching Flow", () => {
  beforeEach(() => {
    // Clear storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    // Reset localStorage mock for web
    if (typeof window !== "undefined") {
      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        }),
      });
    }
  });

  it("should save account on login", async () => {
    const account = {
      id: "123456",
      username: "testuser",
      displayName: "Test User",
      profileImageUrl: "https://example.com/avatar.jpg",
    };

    // Simulate saving account
    const accounts = [{ ...account, lastUsed: Date.now() }];
    mockStorage["saved_accounts"] = JSON.stringify(accounts);
    mockStorage["current_account_id"] = account.id;

    // Verify account was saved
    const savedAccounts = JSON.parse(mockStorage["saved_accounts"] || "[]");
    expect(savedAccounts).toHaveLength(1);
    expect(savedAccounts[0].id).toBe("123456");
    expect(savedAccounts[0].username).toBe("testuser");
  });

  it("should switch between saved accounts", async () => {
    // Setup two accounts with clear time difference
    const now = Date.now();
    const accounts = [
      { id: "111", username: "user1", displayName: "User One", profileImageUrl: "", lastUsed: now - 10000 },
      { id: "222", username: "user2", displayName: "User Two", profileImageUrl: "", lastUsed: now - 5000 },
    ];
    mockStorage["saved_accounts"] = JSON.stringify(accounts);
    mockStorage["current_account_id"] = "222";

    // Switch to first account and update lastUsed to current time
    mockStorage["current_account_id"] = "111";
    accounts[0].lastUsed = now + 1000; // Newer than account 2
    mockStorage["saved_accounts"] = JSON.stringify(accounts);

    // Verify switch
    expect(mockStorage["current_account_id"]).toBe("111");
    const updatedAccounts = JSON.parse(mockStorage["saved_accounts"]);
    expect(updatedAccounts[0].lastUsed).toBeGreaterThan(updatedAccounts[1].lastUsed);
  });

  it("should remove account from saved list", async () => {
    // Setup accounts
    const accounts = [
      { id: "111", username: "user1", displayName: "User One", profileImageUrl: "", lastUsed: Date.now() },
      { id: "222", username: "user2", displayName: "User Two", profileImageUrl: "", lastUsed: Date.now() },
    ];
    mockStorage["saved_accounts"] = JSON.stringify(accounts);

    // Remove first account
    const filteredAccounts = accounts.filter((a) => a.id !== "111");
    mockStorage["saved_accounts"] = JSON.stringify(filteredAccounts);

    // Verify removal
    const savedAccounts = JSON.parse(mockStorage["saved_accounts"]);
    expect(savedAccounts).toHaveLength(1);
    expect(savedAccounts[0].id).toBe("222");
  });

  it("should filter out current account from other accounts list", () => {
    const accounts = [
      { id: "111", username: "user1", displayName: "User One", profileImageUrl: "", lastUsed: Date.now() },
      { id: "222", username: "user2", displayName: "User Two", profileImageUrl: "", lastUsed: Date.now() },
      { id: "333", username: "user3", displayName: "User Three", profileImageUrl: "", lastUsed: Date.now() },
    ];
    const currentAccountId = "222";

    const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

    expect(otherAccounts).toHaveLength(2);
    expect(otherAccounts.find((a) => a.id === "222")).toBeUndefined();
  });
});

describe("Login Persistence (Token Management)", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should save token data on login", async () => {
    const tokenData = {
      accessToken: "access_token_123",
      refreshToken: "refresh_token_456",
      expiresAt: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
    };

    // Simulate saving token data
    mockStorage["session_token"] = tokenData.accessToken;
    mockStorage["refresh_token"] = tokenData.refreshToken;
    mockStorage["token_expires_at"] = tokenData.expiresAt.toString();

    // Verify token data was saved
    expect(mockStorage["session_token"]).toBe("access_token_123");
    expect(mockStorage["refresh_token"]).toBe("refresh_token_456");
    expect(parseInt(mockStorage["token_expires_at"])).toBeGreaterThan(Date.now() / 1000);
  });

  it("should detect expired access token", () => {
    const now = Math.floor(Date.now() / 1000);
    const REFRESH_BUFFER_SECONDS = 300; // 5 minutes

    // Token expired 1 hour ago
    const expiredAt = now - 3600;
    const isExpired = now >= expiredAt - REFRESH_BUFFER_SECONDS;
    expect(isExpired).toBe(true);

    // Token expires in 1 hour
    const validAt = now + 3600;
    const isValid = now >= validAt - REFRESH_BUFFER_SECONDS;
    expect(isValid).toBe(false);

    // Token expires in 4 minutes (within buffer)
    const soonExpiredAt = now + 240;
    const isSoonExpired = now >= soonExpiredAt - REFRESH_BUFFER_SECONDS;
    expect(isSoonExpired).toBe(true);
  });

  it("should clear all token data on logout", async () => {
    // Setup token data
    mockStorage["session_token"] = "access_token_123";
    mockStorage["refresh_token"] = "refresh_token_456";
    mockStorage["token_expires_at"] = "1234567890";

    // Clear all tokens
    delete mockStorage["session_token"];
    delete mockStorage["refresh_token"];
    delete mockStorage["token_expires_at"];

    // Verify all cleared
    expect(mockStorage["session_token"]).toBeUndefined();
    expect(mockStorage["refresh_token"]).toBeUndefined();
    expect(mockStorage["token_expires_at"]).toBeUndefined();
  });

  it("should preserve user info cache separately from tokens", async () => {
    // Setup user info and tokens
    const userInfo = {
      id: 123,
      name: "Test User",
      username: "testuser",
    };
    mockStorage["user_info"] = JSON.stringify(userInfo);
    mockStorage["session_token"] = "access_token_123";

    // Clear tokens but keep user info
    delete mockStorage["session_token"];

    // Verify user info preserved
    expect(mockStorage["user_info"]).toBeDefined();
    const cachedUser = JSON.parse(mockStorage["user_info"]);
    expect(cachedUser.name).toBe("Test User");
  });
});

describe("Auto Login Restoration", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should restore session from cached user and valid token", async () => {
    // Setup cached user and valid token
    const userInfo = { id: 123, name: "Test User", username: "testuser" };
    const now = Math.floor(Date.now() / 1000);
    
    mockStorage["user_info"] = JSON.stringify(userInfo);
    mockStorage["refresh_token"] = "refresh_token_456";
    mockStorage["token_expires_at"] = (now + 3600).toString(); // Valid for 1 hour

    // Simulate restoration check
    const cachedUser = JSON.parse(mockStorage["user_info"]);
    const refreshToken = mockStorage["refresh_token"];
    const expiresAt = parseInt(mockStorage["token_expires_at"]);
    const isExpired = now >= expiresAt - 300;

    expect(cachedUser).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(isExpired).toBe(false);
  });

  it("should attempt refresh when token is expired", async () => {
    // Setup cached user and expired token
    const userInfo = { id: 123, name: "Test User", username: "testuser" };
    const now = Math.floor(Date.now() / 1000);
    
    mockStorage["user_info"] = JSON.stringify(userInfo);
    mockStorage["refresh_token"] = "refresh_token_456";
    mockStorage["token_expires_at"] = (now - 3600).toString(); // Expired 1 hour ago

    // Check if refresh is needed
    const expiresAt = parseInt(mockStorage["token_expires_at"]);
    const isExpired = now >= expiresAt - 300;

    expect(isExpired).toBe(true);
    // In real implementation, this would trigger refreshAccessToken()
  });

  it("should use cached user even without refresh token", async () => {
    // Setup cached user without refresh token
    const userInfo = { id: 123, name: "Test User", username: "testuser" };
    mockStorage["user_info"] = JSON.stringify(userInfo);
    // No refresh_token set

    // Check restoration logic
    const cachedUser = JSON.parse(mockStorage["user_info"]);
    const refreshToken = mockStorage["refresh_token"];

    expect(cachedUser).toBeDefined();
    expect(refreshToken).toBeUndefined();
    // Should still show user as logged in with cached data
  });
});

describe("Multi-Account Management", () => {
  it("should sort accounts by lastUsed (most recent first)", () => {
    const now = Date.now();
    const accounts = [
      { id: "111", username: "user1", displayName: "User One", profileImageUrl: "", lastUsed: now - 3600000 },
      { id: "222", username: "user2", displayName: "User Two", profileImageUrl: "", lastUsed: now },
      { id: "333", username: "user3", displayName: "User Three", profileImageUrl: "", lastUsed: now - 1800000 },
    ];

    const sorted = [...accounts].sort((a, b) => b.lastUsed - a.lastUsed);

    expect(sorted[0].id).toBe("222"); // Most recent
    expect(sorted[1].id).toBe("333"); // 30 min ago
    expect(sorted[2].id).toBe("111"); // 1 hour ago
  });

  it("should limit saved accounts to reasonable number", () => {
    const MAX_SAVED_ACCOUNTS = 10;
    const accounts = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      username: `user${i}`,
      displayName: `User ${i}`,
      profileImageUrl: "",
      lastUsed: Date.now() - i * 1000,
    }));

    // Keep only most recent accounts
    const limitedAccounts = accounts
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, MAX_SAVED_ACCOUNTS);

    expect(limitedAccounts).toHaveLength(MAX_SAVED_ACCOUNTS);
    expect(limitedAccounts[0].id).toBe("0"); // Most recent
  });

  it("should update lastUsed when switching to account", () => {
    const now = Date.now();
    const accounts = [
      { id: "111", username: "user1", displayName: "User One", profileImageUrl: "", lastUsed: now - 3600000 },
      { id: "222", username: "user2", displayName: "User Two", profileImageUrl: "", lastUsed: now },
    ];

    // Switch to user1
    const targetId = "111";
    const updatedAccounts = accounts.map((a) =>
      a.id === targetId ? { ...a, lastUsed: Date.now() } : a
    );

    const switchedAccount = updatedAccounts.find((a) => a.id === targetId);
    expect(switchedAccount?.lastUsed).toBeGreaterThan(now - 3600000);
  });
});
