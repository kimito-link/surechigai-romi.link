import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./_helpers";

/**
 * ログイン確認モーダルの確定後、OAuth遷移が開始されることを確認する。
 * 実OAuth完了（外部サービスでの認証入力）はE2E自動化対象外。
 */
test.describe("Auth OAuth Redirect", () => {
  test.setTimeout(90000);

  test("Xログイン確定でOAuth遷移が開始される", async ({ page }) => {
    const oauthSignals: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (/(clerk|oauth|twitter|x\.com|sign[-_]?in)/i.test(url)) {
        oauthSignals.push(url);
      }
    });

    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await dismissOnboarding(page);

    const entryLoginButton = page.getByRole("button", { name: /Xでログイン/i }).first();
    await expect(entryLoginButton).toBeVisible({ timeout: 10000 });
    await entryLoginButton.click();

    const confirmTitle = page.getByText("Xでログインしますか？");
    await expect(confirmTitle).toBeVisible({ timeout: 10000 });

    const urlBeforeConfirm = page.url();
    const confirmButton = page.getByRole("dialog").getByRole("button", { name: /Xでログイン/i });
    await confirmButton.click();

    // 外部遷移は環境により速度差があるため、短時間待って兆候を確認
    await page.waitForTimeout(6000);

    const urlAfterConfirm = page.url();
    const redirected =
      urlAfterConfirm !== urlBeforeConfirm &&
      /(clerk|oauth|twitter|x\.com|sign[-_]?in|sso)/i.test(urlAfterConfirm);

    expect(
      redirected || oauthSignals.length > 0,
      `OAuth遷移の兆候が見つかりませんでした。urlBefore=${urlBeforeConfirm}, urlAfter=${urlAfterConfirm}`,
    ).toBeTruthy();
  });
});
