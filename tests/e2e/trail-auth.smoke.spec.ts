import { test, expect } from "@playwright/test";
import { gotoSmokePage } from "./helpers/smoke-monitor";
import { hasUsableAuthState } from "./helpers/auth-state";

// 空ファイル（ログイン未完了の残骸）はゲスト実行になるので「無い」扱いにする
const hasAuth = hasUsableAuthState();

// チェックイン実測に必須: ヘッドレスでは geolocation が既定で拒否され、
// 測位失敗→エラー状態になり保存まで到達できない。渋谷駅前の固定座標を注入する
// (実DBに idolfunch の実チェックインが1件できる=それ自体がP0-1保存経路の本番実測)。
test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 35.6581, longitude: 139.7017, accuracy: 15 },
});

/**
 * ログイン済みセッション（.auth/auth-state.json）が必要。
 * 初回: pnpm e2e:auth-save を --headed で実行して X ログイン後に保存。
 */
(hasAuth ? test.describe : test.describe.skip)("authenticated trail smoke", () => {

  test("軌跡ページで履歴セクションまたは空状態が表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/map", { heading: "軌跡" });
    const history = page.getByText("最近の移動履歴");
    const empty = page.getByText(/まだ正確な足あとがありません|ログインすると/);
    await expect(history.or(empty).first()).toBeVisible({ timeout: 15000 });
    monitor.assertClean();
  });

  test("削除フロー: ゴミ箱 → 確認モーダル → キャンセル", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/map", { heading: "軌跡" });

    const deleteBtn = page.getByRole("button", { name: "この足あとを削除" }).first();
    const hasDelete = await deleteBtn.isVisible().catch(() => false);
    test.skip(!hasDelete, "削除可能な足あとがありません（チェックイン後に再実行）");

    await deleteBtn.click();
    await expect(page.getByText("足あとを削除")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("confirm-modal-cancel")).toBeVisible();
    await expect(page.getByTestId("confirm-modal-confirm")).toBeVisible();

    await page.getByTestId("confirm-modal-cancel").click();
    await expect(page.getByText("足あとを削除")).not.toBeVisible({ timeout: 5000 });
    await expect(deleteBtn).toBeVisible();

    monitor.assertClean();
  });

  test("公開切替ボタンが存在すればタップ可能", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/map", { heading: "軌跡" });

    const visibilityBtn = page
      .getByRole("button", { name: /公開|非公開/ })
      .first();
    const visible = await visibilityBtn.isVisible().catch(() => false);
    test.skip(!visible, "公開切替可能な足あとがありません");

    const labelBefore = (await visibilityBtn.textContent())?.trim() ?? "";
    await visibilityBtn.click();
    await page.waitForTimeout(1500);

    const labelAfter = (await visibilityBtn.textContent())?.trim() ?? "";
    expect(labelAfter).not.toBe(labelBefore);

    // 元に戻す
    await visibilityBtn.click();
    monitor.assertClean();
  });

  test("チェックイン: タップで loading 文言が変わる", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/checkin");

    const paused = page.getByText("位置情報は一時停止中です");
    if (await paused.isVisible().catch(() => false)) {
      test.skip(true, "位置情報が一時停止中のためスキップ");
    }

    // サイドバーのタブ名も同じ「チェックイン」なので getByText(exact) は誤爆する。
    // 実際のCTAはボタンのaccessible name「チェックイン — 現在地を記録する」
    // （初回）/「チェックイン — もう一度チェックイン」（再チェックイン）。
    const target = page.getByTestId("checkin-primary-button");
    await target.click();
    // サイドバーの「N人が記録中」に偽マッチしないよう、ローディングバナー自体をtestIDでスコープする
    await expect(page.getByTestId("checkin-locating-banner")).toBeVisible({ timeout: 8000 });

    // チェックイン後は固定シェアボタンが表示される
    await expect(page.getByTestId("checkin-share-button")).toBeVisible({
      timeout: 20000,
    });

    monitor.assertClean();
  });

  test("履歴行に「ここへ向かう」ナビボタンがあれば表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/map", { heading: "軌跡" });

    const navBtn = page.getByRole("button", { name: /車で向かう/ }).first();
    const hasNav = await navBtn.isVisible().catch(() => false);
    test.skip(!hasNav, "ナビ可能な足あとがありません（チェックイン後に再実行）");

    await expect(navBtn).toBeVisible();
    monitor.assertClean();
  });
});
