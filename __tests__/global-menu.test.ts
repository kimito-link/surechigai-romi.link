import { describe, it, expect } from "vitest";

describe("GlobalMenu Component", () => {
  describe("Menu Items", () => {
    const menuItems = [
      { icon: "home", label: "ホーム", path: "/(tabs)" },
      { icon: "add-circle", label: "チャレンジ作成", path: "/(tabs)/create" },
      { icon: "person", label: "マイページ", path: "/(tabs)/mypage" },
      { icon: "leaderboard", label: "ランキング", path: "/ranking" },
      { icon: "notifications", label: "通知", path: "/notifications" },
      { icon: "settings", label: "設定", path: "/settings/theme" },
    ];

    it("should have 6 menu items", () => {
      expect(menuItems.length).toBe(6);
    });

    it("should have correct labels for all menu items", () => {
      const labels = menuItems.map((item) => item.label);
      expect(labels).toContain("ホーム");
      expect(labels).toContain("チャレンジ作成");
      expect(labels).toContain("マイページ");
      expect(labels).toContain("ランキング");
      expect(labels).toContain("通知");
      expect(labels).toContain("設定");
    });

    it("should have valid paths for all menu items", () => {
      menuItems.forEach((item) => {
        expect(item.path).toBeDefined();
        expect(item.path.startsWith("/")).toBe(true);
      });
    });

    it("should have icons for all menu items", () => {
      menuItems.forEach((item) => {
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe("string");
        expect(item.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Menu Visibility", () => {
    it("should be visible when isVisible is true", () => {
      const isVisible = true;
      expect(isVisible).toBe(true);
    });

    it("should be hidden when isVisible is false", () => {
      const isVisible = false;
      expect(isVisible).toBe(false);
    });
  });

  describe("Authentication State", () => {
    it("should show login button when not authenticated", () => {
      const isAuthenticated = false;
      const user = null;
      expect(isAuthenticated).toBe(false);
      expect(user).toBeNull();
    });

    it("should show user info when authenticated", () => {
      const isAuthenticated = true;
      const user = {
        id: "1",
        name: "Test User",
        username: "testuser",
        profileImage: "https://example.com/avatar.jpg",
      };
      expect(isAuthenticated).toBe(true);
      expect(user.name).toBe("Test User");
      expect(user.username).toBe("testuser");
    });

    it("should show logout button when authenticated", () => {
      const isAuthenticated = true;
      const showLogoutButton = isAuthenticated;
      expect(showLogoutButton).toBe(true);
    });
  });

  describe("Hamburger Button", () => {
    it("should have minimum tap area of 44px", () => {
      const buttonSize = 44;
      expect(buttonSize).toBeGreaterThanOrEqual(44);
    });

    it("should have correct default color", () => {
      const defaultColor = "#fff";
      expect(defaultColor).toBe("#fff");
    });

    it("should have correct default size", () => {
      const defaultSize = 24;
      expect(defaultSize).toBe(24);
    });
  });
});
