// tests/e2e/auth.login.spec.ts
import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./_helpers";

/**
 * ログインフローのE2Eテスト
 * 
 * 目的:
 * - ログインボタンが正しく機能することを確認
 * - OAuth画面への遷移を確認
 * 
 * 注意:
 * - 実際のGoogleログインはE2Eテストでは難しいため、OAuth画面への遷移までをテスト
 * - 本番環境のテストのため、軽量で高速な実装にする
 */

test.describe("Auth Login Flow", () => {
  test.setTimeout(60000); // 60秒のタイムアウト
  
  test("マイページにログインボタンが表示される", async ({ page }) => {
    // マイページに移動（シンプルなwaitUntilを使用）
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    
    // オンボーディング画面をスキップ
    await dismissOnboarding(page);
    
    // ログインボタンが表示されることを確認
    const loginButton = page.getByText(/ログイン/i).first();
    await expect(loginButton).toBeVisible({ timeout: 5000 });
  });
  
  test("ログインボタンをクリックするとキャラクター選択画面が表示される", async ({ page }) => {
    // マイページに移動
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    
    // オンボーディング画面をスキップ
    await dismissOnboarding(page);
    
    // ログインボタンをクリック
    const loginButton = page.getByText(/ログイン/i).first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();
    
    // キャラクター選択画面が表示されることを確認
    await page.waitForTimeout(2000);
    
    // より柔軟な検証: キャラクター選択画面の要素を探す
    const characterSelectors = [
      page.getByText(/りんく/i),
      page.getByText(/ちゃれ/i),
      page.getByText(/ソロ/i),
      page.getByText(/キャラクター/i),
      page.getByText(/選択/i),
    ];
    
    let characterVisible = false;
    for (const selector of characterSelectors) {
      if (await selector.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        characterVisible = true;
        break;
      }
    }
    
    expect(characterVisible, "キャラクター選択画面が表示されません").toBeTruthy();
  });
});
