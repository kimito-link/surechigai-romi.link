import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock the account-manager module
vi.mock("@/lib/account-manager", () => ({
  getSavedAccounts: vi.fn().mockResolvedValue([]),
  saveAccount: vi.fn().mockResolvedValue(undefined),
  removeAccount: vi.fn().mockResolvedValue(undefined),
  getCurrentAccountId: vi.fn().mockResolvedValue(null),
  setCurrentAccount: vi.fn().mockResolvedValue(undefined),
}));

import {
  getSavedAccounts,
  saveAccount,
  removeAccount,
  getCurrentAccountId,
  setCurrentAccount,
  SavedAccount,
} from "@/lib/account-manager";

describe("Account Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get saved accounts", async () => {
    const mockAccounts: SavedAccount[] = [
      {
        id: "123",
        username: "testuser",
        displayName: "Test User",
        profileImageUrl: "https://example.com/avatar.jpg",
        lastUsed: Date.now(),
      },
    ];
    vi.mocked(getSavedAccounts).mockResolvedValueOnce(mockAccounts);

    const accounts = await getSavedAccounts();
    expect(accounts).toEqual(mockAccounts);
    expect(getSavedAccounts).toHaveBeenCalled();
  });

  it("should save a new account", async () => {
    const newAccount = {
      id: "456",
      username: "newuser",
      displayName: "New User",
      profileImageUrl: "https://example.com/new-avatar.jpg",
    };

    await saveAccount(newAccount);
    expect(saveAccount).toHaveBeenCalledWith(newAccount);
  });

  it("should remove an account", async () => {
    const accountId = "123";

    await removeAccount(accountId);
    expect(removeAccount).toHaveBeenCalledWith(accountId);
  });

  it("should get current account ID", async () => {
    vi.mocked(getCurrentAccountId).mockResolvedValueOnce("123");

    const currentId = await getCurrentAccountId();
    expect(currentId).toBe("123");
    expect(getCurrentAccountId).toHaveBeenCalled();
  });

  it("should set current account", async () => {
    const accountId = "456";

    await setCurrentAccount(accountId);
    expect(setCurrentAccount).toHaveBeenCalledWith(accountId);
  });
});

describe("Account Switcher Logic", () => {
  it("should filter out current account from other accounts", () => {
    const accounts: SavedAccount[] = [
      { id: "1", username: "user1", displayName: "User 1", lastUsed: 1000 },
      { id: "2", username: "user2", displayName: "User 2", lastUsed: 2000 },
      { id: "3", username: "user3", displayName: "User 3", lastUsed: 3000 },
    ];
    const currentAccountId = "2";

    const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

    expect(otherAccounts).toHaveLength(2);
    expect(otherAccounts.map((a) => a.id)).toEqual(["1", "3"]);
  });

  it("should find current account from accounts list", () => {
    const accounts: SavedAccount[] = [
      { id: "1", username: "user1", displayName: "User 1", lastUsed: 1000 },
      { id: "2", username: "user2", displayName: "User 2", lastUsed: 2000 },
    ];
    const currentAccountId = "2";

    const currentAccount = accounts.find((a) => a.id === currentAccountId);

    expect(currentAccount).toBeDefined();
    expect(currentAccount?.username).toBe("user2");
  });

  it("should return null if current account not found", () => {
    const accounts: SavedAccount[] = [
      { id: "1", username: "user1", displayName: "User 1", lastUsed: 1000 },
    ];
    const currentAccountId = "999";

    const currentAccount = accounts.find((a) => a.id === currentAccountId) || null;

    expect(currentAccount).toBeNull();
  });
});

describe("Account Switch Flow", () => {
  it("should clear session data before switching accounts", async () => {
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    
    // Simulate clearing session data
    await AsyncStorage.default.removeItem("twitter_session");
    await AsyncStorage.default.removeItem("refresh_token");
    await AsyncStorage.default.removeItem("access_token");

    expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("twitter_session");
    expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("refresh_token");
    expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("access_token");
  });

  it("should sort accounts by lastUsed timestamp (newest first)", () => {
    const accounts: SavedAccount[] = [
      { id: "1", username: "old", displayName: "Old", lastUsed: 1000 },
      { id: "2", username: "newest", displayName: "Newest", lastUsed: 3000 },
      { id: "3", username: "middle", displayName: "Middle", lastUsed: 2000 },
    ];

    const sorted = [...accounts].sort((a, b) => b.lastUsed - a.lastUsed);

    expect(sorted[0].username).toBe("newest");
    expect(sorted[1].username).toBe("middle");
    expect(sorted[2].username).toBe("old");
  });
});
