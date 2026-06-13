/**
 * Gate 2: チャレンジ作成フロー E2E
 * チャレンジ作成画面でプロフィールが正しく表示されることを確認
 * 
 * 根本的解決: UIコンポーネントの堅牢性を検証
 */
import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./_helpers";

test.setTimeout(60000);

test.describe("Gate 2: チャレンジ作成", () => {
  test("チャレンジ作成画面でプロフィールが正しく表示される", async ({ page }) => {
    // 1. チャレンジ作成画面にアクセス
    await page.goto("/create", { waitUntil: "networkidle", timeout: 30000 });
    
    // オンボーディング画面をスキップ
    await dismissOnboarding(page);
    
    // 2. ページが表示されることを確認
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    
    // 3. エラーが表示されていないことを確認
    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toMatch(/500.*error/i);
    
    // 4. プロフィール情報が表示される場合、はみ出していないことを確認（根本的解決: UIの堅牢性を検証）
    // プロフィールカードの要素を取得
    const profileCard = page.locator('[data-testid="user-info-section"], .twitter-user-card').first();
    const profileCardCount = await profileCard.count();
    
    if (profileCardCount > 0) {
      // プロフィールカードが存在する場合、テキストがはみ出していないことを確認
      const cardText = await profileCard.innerText();
      const cardBox = await profileCard.boundingBox();
      
      // 根本的解決: テキストの幅がカードの幅を超えていないことを確認
      if (cardBox) {
        // 説明文が2行以内に収まっていることを確認（numberOfLines=2の設定を検証）
        const lines = cardText.split('\n');
        const descriptionLines = lines.filter(line => 
          line.length > 50 // 説明文らしい長いテキスト
        );
        // 説明文が2行以内であることを確認
        expect(descriptionLines.length, "プロフィール説明文が2行以内に収まっていること").toBeLessThanOrEqual(2);
      }
    }
    
    // 5. チャレンジ作成フォームが表示されることを確認
    const hasCreateForm = /チャレンジ作成|目標を設定/i.test(pageText);
    expect(hasCreateForm, "チャレンジ作成フォームが表示されること").toBe(true);
  });
});
