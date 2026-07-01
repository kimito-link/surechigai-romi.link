import { test, expect } from "@playwright/test";
import { gotoSmokePage } from "./helpers/smoke-monitor";

/** ゲスト画面のログイン誘導 — コントラスト退行のスモーク */
test.describe("contrast guest", () => {
  test("現在地タブの X CTA 文言が DOM に存在する", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/", { heading: "現在地" });
    await expect(page.getByRole("link", { name: /Xではじめる/i })).toBeVisible();
    await expect(page.getByText("ログインして、封筒と足あとを受け取ろう")).toBeVisible();
    monitor.assertClean();
  });

  test("チェックインゲストの CTA が表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/checkin", {
      heading: /チェックイン|現在地を記録/,
    });
    await expect(page.getByRole("link", { name: /Xではじめる/i })).toBeVisible();
    monitor.assertClean();
  });
});
