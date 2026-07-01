import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { AUTH_STATE_PATH, attachSmokeMonitor } from "./helpers/smoke-monitor";

const authFile = path.resolve(process.cwd(), AUTH_STATE_PATH);
const hasAuth = fs.existsSync(authFile);

(hasAuth ? test.describe : test.describe.skip)("events host smoke", () => {
  test.use({ storageState: authFile });

  test("主催タブ: フォーム表示と URL 未入力バリデーション", async ({ page }) => {
    const monitor = attachSmokeMonitor(page);
    await page.goto("/events", { waitUntil: "domcontentloaded" });

    await page.getByRole("tab", { name: "主催" }).click();
    await expect(page.getByText("集まりを立てる")).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel("配信または通話のURL（必須）")).toBeVisible();

    await page.getByLabel("集まりのタイトル").fill("E2E smoke test");
    await page.getByRole("button", { name: "予定を作成" }).click();

    await expect(page.getByText(/URL/)).toBeVisible({ timeout: 5000 });
    monitor.assertClean();
  });

  test("主催タブ: オンライン作成 → 一覧に表示", async ({ page }) => {
    const monitor = attachSmokeMonitor(page);
    await page.goto("/events", { waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: "主催" }).click();

    const title = `E2E ${Date.now()}`;
    await page.getByLabel("集まりのタイトル").fill(title);
    await page.getByLabel("配信または通話のURL（必須）").fill("https://example.com/live");
    await page.getByRole("button", { name: "予定を作成" }).click();

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 });
    monitor.assertClean();
  });
});

test.describe("events host — guest", () => {
  test("未ログイン: 主催タブなし・ログイン誘導バナー", async ({ page }) => {
    await page.goto("/events", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("集まり").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: "主催" })).toHaveCount(0);
    await expect(page.getByText(/ログインすると集まりを主催/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("予定", { exact: true })).toBeVisible();
    await expect(page.getByText("ライブ中", { exact: true })).toBeVisible();
  });
});
