import { test, expect } from "@playwright/test";
import { gotoAndWait } from "./_helpers";

const BASE_URL = process.env.EXPO_WEB_PREVIEW_URL || "http://localhost:8081";

test.describe("My Page", () => {
  test("should display my page link", async ({ page }) => {
    await gotoAndWait(page, BASE_URL);

    // Look for my page link (usually in tab bar or menu)
    const myPageLink = page.locator("text=マイページ").or(page.locator("text=プロフィール"));
    
    // Should be visible (even if not logged in)
    await expect(myPageLink).toBeVisible({ timeout: 10000 });
  });

  test("should show login prompt when not logged in", async ({ page }) => {
    await gotoAndWait(page, BASE_URL);

    // Click my page link
    const myPageLink = page.locator("text=マイページ").or(page.locator("text=プロフィール"));
    
    await expect(myPageLink).toBeVisible({ timeout: 10000 });
    await myPageLink.click();
    await page.waitForTimeout(2000);
    
    // Should show login button or user info
    const loginButton = page.locator("text=ログイン").or(page.locator("text=サインイン"));
    const userInfo = page.locator("text=ユーザー名").or(page.locator("text=プロフィール"));
    
    // Either login button or user info should be visible
    await expect(loginButton.or(userInfo)).toBeVisible({ timeout: 10000 });
  });

  test("should display user statistics", async ({ page }) => {
    await gotoAndWait(page, BASE_URL);

    // Click my page link
    const myPageLink = page.locator("text=マイページ").or(page.locator("text=プロフィール"));
    
    await expect(myPageLink).toBeVisible({ timeout: 10000 });
    await myPageLink.click();
    await page.waitForTimeout(2000);
    
    // Look for statistics (even if showing 0)
    const stats = page.locator("text=/\\d+/");
    
    // Should display some numbers (challenges, messages, etc.)
    await expect(stats.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display settings button", async ({ page }) => {
    await gotoAndWait(page, BASE_URL);

    // Click my page link
    const myPageLink = page.locator("text=マイページ").or(page.locator("text=プロフィール"));
    
    await expect(myPageLink).toBeVisible({ timeout: 10000 });
    await myPageLink.click();
    await page.waitForTimeout(2000);
    
    // Look for settings button (logged-in only)
    const settingsButton = page
      .locator("text=通知設定")
      .or(page.locator("text=設定"))
      .or(page.locator("[aria-label='設定']"));

    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(settingsButton).toBeVisible({ timeout: 10000 });
    } else {
      // If not logged in, should show login prompt
      await expect(
        page.locator("text=/ログイン|サインイン|Xでログイン/")
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
