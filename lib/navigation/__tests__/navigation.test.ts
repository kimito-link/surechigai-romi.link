/**
 * ナビゲーションユーティリティのユニットテスト
 * v6.38: router.push移行後のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// expo-routerのモック
vi.mock("expo-router", () => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  },
}));

// react-nativeのモック
vi.mock("react-native", () => ({
  Linking: {
    canOpenURL: vi.fn().mockResolvedValue(true),
    openURL: vi.fn().mockResolvedValue(undefined),
  },
  Platform: {
    OS: "ios",
  },
}));

import { router } from "expo-router";
import {
  navigate,
  navigateBack,
  navigateReplace,
  STATIC_ROUTES,
  DYNAMIC_ROUTES,
} from "../app-routes";
import {
  openExternalUrl,
  openTwitterProfile,
  openTwitterShare,
  getAllowedDomains,
} from "../external-links";
import { Linking } from "react-native";

describe("app-routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("STATIC_ROUTES", () => {
    it("should have correct home routes", () => {
      expect(STATIC_ROUTES.HOME).toBe("/(tabs)");
      expect(STATIC_ROUTES.HOME_ROOT).toBe("/");
    });

    it("should have correct tab routes", () => {
      expect(STATIC_ROUTES.CREATE_TAB).toBe("/(tabs)/create");
      expect(STATIC_ROUTES.MYPAGE_TAB).toBe("/(tabs)/mypage");
    });

    it("should have correct settings routes", () => {
      expect(STATIC_ROUTES.SETTINGS).toBe("/settings");
      expect(STATIC_ROUTES.NOTIFICATION_SETTINGS).toBe("/notification-settings");
      expect(STATIC_ROUTES.HELP).toBe("/help");
    });
  });

  describe("DYNAMIC_ROUTES", () => {
    it("should have correct event routes", () => {
      expect(DYNAMIC_ROUTES.EVENT_DETAIL).toBe("/event/[id]");
      expect(DYNAMIC_ROUTES.EDIT_CHALLENGE).toBe("/edit-challenge/[id]");
      expect(DYNAMIC_ROUTES.DASHBOARD).toBe("/dashboard/[id]");
    });

    it("should have correct profile routes", () => {
      expect(DYNAMIC_ROUTES.PROFILE).toBe("/profile/[userId]");
      expect(DYNAMIC_ROUTES.FOLLOWING).toBe("/following");
      expect(DYNAMIC_ROUTES.FOLLOWERS).toBe("/followers");
    });
  });

  describe("navigate functions", () => {
    it("should navigate to home", () => {
      navigate.toHome();
      expect(router.push).toHaveBeenCalledWith("/(tabs)");
    });

    it("should navigate to create tab", () => {
      navigate.toCreateTab();
      expect(router.push).toHaveBeenCalledWith("/(tabs)/create");
    });

    it("should navigate to mypage tab", () => {
      navigate.toMypageTab();
      expect(router.push).toHaveBeenCalledWith("/(tabs)/mypage");
    });

    it("should navigate to mypage with return path", () => {
      navigate.toMypageWithReturn("/event/123");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/(tabs)/mypage",
        params: { returnTo: "/event/123" },
      });
    });

    it("should navigate to settings", () => {
      navigate.toSettings();
      expect(router.push).toHaveBeenCalledWith("/settings");
    });

    it("should navigate to event detail with id", () => {
      navigate.toEventDetail(123);
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/event/[id]",
        params: { id: "123" },
      });
    });

    it("should navigate to event detail with string id", () => {
      navigate.toEventDetail("abc");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/event/[id]",
        params: { id: "abc" },
      });
    });

    it("should navigate to event detail with invite code", () => {
      navigate.toEventDetailWithInvite(123, "INVITE123");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/event/[id]",
        params: { id: "123", inviteCode: "INVITE123" },
      });
    });

    it("should navigate to profile", () => {
      navigate.toProfile("user123");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/profile/[userId]",
        params: { userId: "user123" },
      });
    });

    it("should navigate to messages with challengeId", () => {
      navigate.toMessages(123, 456);
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/messages/[id]",
        params: { id: "123", challengeId: "456" },
      });
    });

    it("should navigate to messages without challengeId", () => {
      navigate.toMessages(123);
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/messages/[id]",
        params: { id: "123" },
      });
    });

    it("should navigate to create with template", () => {
      navigate.toCreateWithTemplate({
        id: 1,
        goalType: "participants",
        goalValue: 100,
        goalUnit: "人",
        eventType: "birthday",
        ticketPresale: "3000",
        ticketDoor: "3500",
      });
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/(tabs)/create",
        params: {
          templateId: 1,
          goalType: "participants",
          goalValue: 100,
          goalUnit: "人",
          eventType: "birthday",
          ticketPresale: "3000",
          ticketDoor: "3500",
        },
      });
    });

    it("should call router.back", () => {
      navigate.back();
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe("navigateBack", () => {
    it("should call router.back", () => {
      navigateBack();
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe("navigateReplace functions", () => {
    it("should replace to home", () => {
      navigateReplace.toHome();
      expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    });

    it("should replace to home root", () => {
      navigateReplace.toHomeRoot();
      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("should replace to mypage tab", () => {
      navigateReplace.toMypageTab();
      expect(router.replace).toHaveBeenCalledWith("/(tabs)/mypage");
    });

    it("should replace with URL", () => {
      navigateReplace.withUrl("/event/123");
      expect(router.replace).toHaveBeenCalledWith("/event/123");
    });
  });
});

describe("external-links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllowedDomains", () => {
    it("should return allowed domains list", () => {
      const domains = getAllowedDomains();
      expect(domains).toContain("twitter.com");
      expect(domains).toContain("x.com");
      expect(domains).toContain("youtube.com");
      expect(domains).toContain("eplus.jp");
    });

    it("should include SNS domains", () => {
      const domains = getAllowedDomains();
      expect(domains).toContain("instagram.com");
      expect(domains).toContain("facebook.com");
      expect(domains).toContain("tiktok.com");
    });

    it("should include ticket sites", () => {
      const domains = getAllowedDomains();
      expect(domains).toContain("pia.jp");
      expect(domains).toContain("l-tike.com");
      expect(domains).toContain("tiget.net");
    });
  });

  describe("openExternalUrl", () => {
    it("should open valid Twitter URL", async () => {
      const result = await openExternalUrl("https://twitter.com/testuser");
      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith("https://twitter.com/testuser");
    });

    it("should open valid YouTube URL", async () => {
      const result = await openExternalUrl("https://www.youtube.com/watch?v=abc123");
      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith("https://www.youtube.com/watch?v=abc123");
    });

    it("should reject non-HTTPS URL", async () => {
      const result = await openExternalUrl("http://twitter.com/testuser");
      expect(result).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should reject non-whitelisted domain", async () => {
      const result = await openExternalUrl("https://malicious-site.com/phishing");
      expect(result).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should reject invalid URL", async () => {
      const result = await openExternalUrl("not-a-valid-url");
      expect(result).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe("openTwitterProfile", () => {
    it("should open Twitter profile without @", async () => {
      await openTwitterProfile("testuser");
      expect(Linking.openURL).toHaveBeenCalledWith("https://twitter.com/testuser");
    });

    it("should strip @ from username", async () => {
      await openTwitterProfile("@testuser");
      expect(Linking.openURL).toHaveBeenCalledWith("https://twitter.com/testuser");
    });
  });

  describe("openTwitterShare", () => {
    it("should open Twitter share with text only", async () => {
      await openTwitterShare("Check this out!");
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining("https://twitter.com/intent/tweet?text=")
      );
    });

    it("should open Twitter share with text and URL", async () => {
      await openTwitterShare("Check this out!", "https://example.com");
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining("https://twitter.com/intent/tweet?text=")
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining("url=")
      );
    });
  });
});
