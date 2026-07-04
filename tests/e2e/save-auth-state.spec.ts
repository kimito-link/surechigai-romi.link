import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { AUTH_STATE_PATH } from "./helpers/smoke-monitor";

/**
 * 一度だけ --headed で実行し、X ログイン完了後に storageState を保存する。
 *
 *   PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm e2e:auth-save
 *   またはローカル: PLAYWRIGHT_BASE_URL=http://localhost:8081 pnpm e2e:auth-save
 */
test("save authenticated session", async ({ page, context }) => {
  test.setTimeout(300_000);

  await page.goto("/map", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("body");

  console.log("\n--- 手動操作 ---");
  console.log("1. 表示されたブラウザで X ログインを完了してください");
  console.log("2. 軌跡ページに戻り「最近の移動履歴」またはログイン後 UI が見えるまで待ってください");
  console.log("3. テストは最大 4 分待機します\n");

  // ログイン済み判定は「ゲスト向け文言が消えたこと」だけに頼らない（消えて見える理由は
  // 未ログイン以外にも多数ある = 偽陽性で即passしてしまうバグが実際に発生した）。
  // Clerk のセッションが localStorage に実在することを正とする。
  await expect(async () => {
    const hasClerkSession = await page
      .evaluate(() => Object.keys(localStorage).some((k) => k.toLowerCase().includes("clerk")))
      .catch(() => false);
    expect(hasClerkSession).toBeTruthy();

    const loggedInHint =
      (await page.getByText("最近の移動履歴").isVisible().catch(() => false)) ||
      (await page.getByText("まだ正確な足あとがありません").isVisible().catch(() => false));
    expect(loggedInHint).toBeTruthy();
  }).toPass({ timeout: 240_000 });

  const outDir = path.dirname(path.resolve(process.cwd(), AUTH_STATE_PATH));
  fs.mkdirSync(outDir, { recursive: true });
  await context.storageState({ path: AUTH_STATE_PATH });

  // 保存内容がから（cookies/originsが空）のまま「保存完了」と誤表示しないよう検証する。
  const saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf8"));
  const isEmpty =
    (!Array.isArray(saved.cookies) || saved.cookies.length === 0) &&
    (!Array.isArray(saved.origins) || saved.origins.length === 0);
  if (isEmpty) {
    throw new Error(
      `保存された認証状態が空です（cookies/originsが0件）。ログインが実際には完了していません: ${AUTH_STATE_PATH}`,
    );
  }

  console.log(`\n保存完了: ${AUTH_STATE_PATH}`);
  console.log("以後 pnpm e2e で trail-auth.smoke.spec.ts が実行されます\n");
});
