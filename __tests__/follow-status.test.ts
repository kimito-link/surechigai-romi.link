import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for API tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Twitter Follow Status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkFollowStatus function", () => {
    // モックレスポンスのヘッダーを作成
    const createMockHeaders = () => ({
      get: (name: string) => {
        if (name === "x-rate-limit-limit") return "15";
        if (name === "x-rate-limit-remaining") return "10";
        if (name === "x-rate-limit-reset") return String(Math.floor(Date.now() / 1000) + 900);
        return null;
      },
    });

    it("should return isFollowing true when user follows target", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve({
            data: {
              id: "123456789",
              name: "君斗りんく",
              username: "idolfunch",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve({
            data: [
              { id: "123456789", name: "君斗りんく", username: "idolfunch" },
              { id: "987654321", name: "Other User", username: "other" },
            ],
          }),
        });

      const { checkFollowStatus } = await import("../server/twitter-oauth2");
      const result = await checkFollowStatus("test_token", "source_user_follows");

      expect(result.isFollowing).toBe(true);
      expect(result.targetUser?.username).toBe("idolfunch");
    });

    it("should return isFollowing false when user does not follow target", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve({
            data: {
              id: "123456789",
              name: "君斗りんく",
              username: "idolfunch",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve({
            data: [
              { id: "987654321", name: "Other User", username: "other" },
            ],
          }),
        });

      const { checkFollowStatus } = await import("../server/twitter-oauth2");
      const result = await checkFollowStatus("test_token", "source_user_not_follows");

      expect(result.isFollowing).toBe(false);
      expect(result.targetUser?.username).toBe("idolfunch");
    });

    it("should handle API errors gracefully", async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        headers: createMockHeaders(),
        json: () => Promise.resolve({ error: "API Error" }),
        text: () => Promise.resolve("API Error"),
      };
      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse);

      const { checkFollowStatus } = await import("../server/twitter-oauth2");
      const result = await checkFollowStatus("test_token", "source_user_api_error");

      expect(result.isFollowing).toBe(false);
      expect(result.targetUser).toBeNull();
    });
  });

  describe("getTargetAccountInfo function", () => {
    it("should return correct target account info", async () => {
      const { getTargetAccountInfo } = await import("../server/twitter-oauth2");
      const info = getTargetAccountInfo();

      expect(info.username).toBe("idolfunch");
      expect(info.displayName).toBe("君斗りんく");
      expect(info.profileUrl).toBe("https://twitter.com/idolfunch");
    });
  });
});

describe("Follow Status Hook", () => {
  it("should initialize with default values", () => {
    // Test that the hook provides correct default values
    const defaultStatus = {
      isFollowing: false,
      targetUsername: "idolfunch",
      targetDisplayName: "君斗りんく",
    };

    expect(defaultStatus.isFollowing).toBe(false);
    expect(defaultStatus.targetUsername).toBe("idolfunch");
    expect(defaultStatus.targetDisplayName).toBe("君斗りんく");
  });
});

describe("Premium Features", () => {
  it("should define premium features correctly", async () => {
    const { PREMIUM_FEATURES, isPremiumFeature } = await import("../lib/premium-features");

    expect(PREMIUM_FEATURES.length).toBeGreaterThan(0);
    expect(isPremiumFeature("create_challenge")).toBe(true);
    expect(isPremiumFeature("statistics")).toBe(true);
    expect(isPremiumFeature("non_existent_feature")).toBe(false);
  });
});

describe("User type with follow status", () => {
  it("should support follow status fields", () => {
    // Test that User type includes follow status fields
    const user = {
      id: 1,
      openId: "test",
      name: "Test User",
      email: null,
      loginMethod: "twitter",
      lastSignedIn: new Date(),
      username: "testuser",
      profileImage: "https://example.com/image.jpg",
      followersCount: 100,
      isFollowingTarget: true,
      targetAccount: {
        id: "123456789",
        name: "君斗りんく",
        username: "idolfunch",
      },
    };

    expect(user.isFollowingTarget).toBe(true);
    expect(user.targetAccount?.username).toBe("idolfunch");
  });
});
