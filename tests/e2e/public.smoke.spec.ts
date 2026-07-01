import { test, expect } from "@playwright/test";
import { gotoSmokePage } from "./helpers/smoke-monitor";

/**
 * 未ログインでもアクセスできる主要タブのスモーク。
 * console.error / pageerror / 想定外 HTTP エラーを検知する。
 */
test.describe("public smoke", () => {
  test("ホームが表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/");
    await expect(page.locator("body")).toBeVisible();
    monitor.assertClean();
  });

  test("図鑑タブが表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/zukan", { heading: "みんなの現在地" });
    monitor.assertClean();
  });

  test("軌跡タブが表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/map", { heading: "軌跡" });
    monitor.assertClean();
  });

  test("チェックインタブが表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/checkin", {
      heading: /チェックイン|現在地を記録/,
    });
    monitor.assertClean();
  });

  test("LP が表示される", async ({ page }) => {
    const monitor = await gotoSmokePage(page, "/lp/");
    await expect(page.locator("body")).toBeVisible();
    monitor.assertClean();
  });
});
