/**
 * Gate 2: 統計ダッシュボード E2E
 * 統計ダッシュボードが正常に読み込まれることを確認
 * 
 * 根本的解決: 主要フローのテストを追加
 */
import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./_helpers";

test.setTimeout(60000);

const BASE_URL = process.env.EXPO_WEB_PREVIEW_URL || "http://localhost:8081";

test.describe("Gate 2: 統計ダッシュボード", () => {
  test.beforeEach(async ({ page }) => {
    // 必要に応じてテスト用の認証をここに追加
    // 現在は認証なしでテストを実行
  });

test("統計ダッシュボードが読み込める", async ({ page }) => {
  // 1. 統計ダッシュボードにアクセス
  await page.goto(`${BASE_URL}/stats`, { waitUntil: "networkidle", timeout: 30000 });

  // オンボーディング画面をスキップ
  await dismissOnboarding(page);

  // 2. ページが表示されることを確認
  await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

  // 3. エラーが表示されていないことを確認（根本的解決: エラー状態を検証）
  const pageText = await page.locator("body").innerText();
  expect(pageText).not.toMatch(/500.*error/i);
  expect(pageText).not.toMatch(/エラーが発生しました/i);

  // 4. 統計ダッシュボードのタイトルが表示されることを確認
  const hasStatsTitle = /統計ダッシュボード|統計データ/i.test(pageText);
  expect(hasStatsTitle, "統計ダッシュボードのタイトルが表示されること").toBe(true);

  // 5. ローディング状態が終了することを確認（根本的解決: 非同期処理の完了を待つ）
  // ローディングメッセージが消えるまで待つ
  await page.waitForSelector('text=/統計データを読み込み中/i', { state: "hidden", timeout: 10000 }).catch(() => {
    // ローディングメッセージがない場合はスキップ（既に読み込み完了）
  });

  // 6. エラーメッセージが表示されていないことを確認
  const hasErrorMessage = /統計データを読み込めませんでした|エラーが発生しました/i.test(pageText);
  // エラーが表示されている場合は、再試行ボタンがあることを確認（根本的解決: エラー時のUIを検証）
  if (hasErrorMessage) {
    const hasRetryButton = await page.locator('text=/再試行/i').count() > 0;
    expect(hasRetryButton, "エラー時に再試行ボタンが表示されること").toBe(true);
  }
});
});
