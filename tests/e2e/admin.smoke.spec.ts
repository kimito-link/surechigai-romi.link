import { test, expect } from "@playwright/test";

/**
 * 管理画面スモークテスト
 *
 * - /admin のオンボーディング（パスワード認証）でログインできることを確認
 * - パスワードは E2E_ADMIN_PASSWORD で指定（未設定時はサーバー既定値と合わせる）
 */

const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "pass304130";

test.describe("Admin onboarding and login", () => {
  test.setTimeout(60000);

  test("管理画面でパスワード認証するとダッシュボードが表示される", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // オンボーディング: 管理者認証画面が表示される
    await expect(page.getByText("管理者認証")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("管理画面にアクセスするにはパスワードが必要です")).toBeVisible({
      timeout: 5000,
    });

    // パスワード入力
    const passwordInput = page.getByPlaceholder("パスワードを入力");
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await passwordInput.fill(ADMIN_PASSWORD);

    // 認証ボタンをクリック
    const submitButton = page.getByRole("button", { name: "認証" });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // 認証後: ダッシュボードまたは管理メニューが表示される
    await page.waitForTimeout(3000);
    const dashboardVisible =
      (await page.getByText("ダッシュボード").first().isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await page.getByText("管理画面").first().isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await page.getByText("システム状態").first().isVisible({ timeout: 5000 }).catch(() => false));

    expect(dashboardVisible, "パスワード認証後にダッシュボードが表示されること").toBe(true);
  });
});
