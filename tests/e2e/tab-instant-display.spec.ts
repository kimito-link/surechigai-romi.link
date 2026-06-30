import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { AUTH_STATE_PATH, attachSmokeMonitor } from "./helpers/smoke-monitor";

const authFile = path.resolve(process.cwd(), AUTH_STATE_PATH);
const hasAuth = fs.existsSync(authFile);

const EMPTY_TRAIL_TEXT = "まだ正確な足あとがありません";

(hasAuth ? test.describe : test.describe.skip)("tab instant display", () => {
  test.use({ storageState: authFile });

  test("軌跡: データありユーザーで空状態が500ms以内に出ない", async ({ page }) => {
    const monitor = attachSmokeMonitor(page);
    await page.goto("/map", { waitUntil: "domcontentloaded" });

    const empty = page.getByText(EMPTY_TRAIL_TEXT);
    const history = page.getByText("最近の移動履歴");
    const loading = page.getByTestId("tab-query-loading");

    await page.waitForTimeout(500);
    const emptyVisible = await empty.isVisible().catch(() => false);
    const historyVisible = await history.isVisible().catch(() => false);
    const loadingVisible = await loading.isVisible().catch(() => false);

    if (emptyVisible && !historyVisible && !loadingVisible) {
      const ctxBar = page.getByText(/足あと \d+ 件を記録中/);
      const hasTrailCount = await ctxBar.isVisible().catch(() => false);
      if (hasTrailCount) {
        expect(emptyVisible, "コンテキストバーに件数があるのに空状態が先に出た").toBe(false);
      }
    }

    await expect(history.or(empty).or(loading).first()).toBeVisible({ timeout: 15000 });
    monitor.assertClean();
  });

  test("全タブ: ヘッダーが2秒以内に表示される", async ({ page }) => {
    const tabs: { path: string; heading: string | RegExp }[] = [
      { path: "/", heading: /ポスト|封筒|すれ違い/ },
      { path: "/checkin", heading: "チェックイン" },
      { path: "/events", heading: "集まり" },
      { path: "/zukan", heading: "図鑑" },
      { path: "/map", heading: "軌跡" },
      { path: "/mypage", heading: "マイページ" },
    ];

    for (const tab of tabs) {
      await page.goto(tab.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(tab.heading).first()).toBeVisible({ timeout: 2000 });
    }
  });
});
