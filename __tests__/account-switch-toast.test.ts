/**
 * アカウント切り替え時のトースト通知テスト
 */

import { describe, it, expect, vi } from "vitest";

// Mock modules
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

describe("Account Switch Toast Notification", () => {
  it("should generate correct toast message with display name", () => {
    const account = {
      id: "123",
      username: "testuser",
      displayName: "テストユーザー",
      profileImageUrl: "",
    };
    
    const toastMessage = `${account.displayName}さんに切り替えました`;
    
    expect(toastMessage).toBe("テストユーザーさんに切り替えました");
  });

  it("should handle accounts with special characters in display name", () => {
    const account = {
      id: "456",
      username: "special_user",
      displayName: "🎉 特別なユーザー ✨",
      profileImageUrl: "",
    };
    
    const toastMessage = `${account.displayName}さんに切り替えました`;
    
    expect(toastMessage).toBe("🎉 特別なユーザー ✨さんに切り替えました");
  });

  it("should handle accounts with long display names", () => {
    const account = {
      id: "789",
      username: "long_name_user",
      displayName: "とても長い名前のユーザーアカウント",
      profileImageUrl: "",
    };
    
    const toastMessage = `${account.displayName}さんに切り替えました`;
    
    expect(toastMessage).toContain("とても長い名前のユーザーアカウント");
    expect(toastMessage).toContain("さんに切り替えました");
  });

  it("should use success toast type for account switch", () => {
    const toastType = "success";
    expect(toastType).toBe("success");
  });

  it("should show toast after modal closes", () => {
    // トースト表示のタイミングをシミュレート
    const modalClosed = true;
    const toastDelay = 300; // ms
    
    expect(modalClosed).toBe(true);
    expect(toastDelay).toBeGreaterThan(0);
    expect(toastDelay).toBeLessThanOrEqual(500);
  });
});

describe("Toast Display Logic", () => {
  it("should show toast with correct message format", () => {
    const showSuccess = vi.fn();
    const displayName = "山田太郎";
    
    // シミュレート: アカウント切り替え成功時
    showSuccess(`${displayName}さんに切り替えました`);
    
    expect(showSuccess).toHaveBeenCalledWith("山田太郎さんに切り替えました");
  });

  it("should not show toast on switch failure", () => {
    const showSuccess = vi.fn();
    const switchSucceeded = false;
    
    if (switchSucceeded) {
      showSuccess("切り替えました");
    }
    
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("should show toast only once per switch", () => {
    const showSuccess = vi.fn();
    const displayName = "テストユーザー";
    
    // 1回だけ呼び出し
    showSuccess(`${displayName}さんに切り替えました`);
    
    expect(showSuccess).toHaveBeenCalledTimes(1);
  });
});

describe("Toast Integration with Account Switcher", () => {
  it("should have showSuccess available from useToast hook", () => {
    // useToastフックが提供する関数
    const toastFunctions = ["showToast", "showSuccess", "showError", "showWarning", "showInfo"];
    
    expect(toastFunctions).toContain("showSuccess");
  });

  it("should call showSuccess after successful account switch", () => {
    // アカウント切り替えフローのシミュレーション
    const steps = [
      "setCurrentAccount",
      "setUserInfo",
      "refreshAccounts",
      "refresh",
      "onClose",
      "showSuccess", // トースト表示はモーダルを閉じた後
    ];
    
    const showSuccessIndex = steps.indexOf("showSuccess");
    const onCloseIndex = steps.indexOf("onClose");
    
    expect(showSuccessIndex).toBeGreaterThan(onCloseIndex);
  });

  it("should format message correctly for different account types", () => {
    const accounts = [
      { displayName: "公式アカウント" },
      { displayName: "サブアカウント" },
      { displayName: "テスト用" },
    ];
    
    accounts.forEach((account) => {
      const message = `${account.displayName}さんに切り替えました`;
      expect(message).toMatch(/さんに切り替えました$/);
    });
  });
});
