/**
 * 1タップXログイン導線（AutoAdvanceToX）の常設検証。
 *
 * 移植元: kimitolink-linktree/e2e/login-one-tap-x.spec.ts
 *（HANDOFF-login-one-tap-x.md §7「新spec」の設計に準拠）
 *
 * 検証していること:
 *   1. 実CTAと同じ auto=x 付きURL（lib/clerk-route.ts の SIGN_IN_AUTO_X_HREF）で
 *      sign-in に着地すると、ユーザー操作ゼロで Clerk 標準の X ボタンへ click が
 *      自動で届き、X（x.com）方向への OAuth 開始ナビゲーションが試行される。
 *   2. auto=x なしの素の /sign-in では勝手に OAuth を開始しない。
 *   3. クールダウン中（連続リロード）は再発火しない（X側レート制限の地雷封じ）。
 *   4. ゲストホームの CTA href が auto=x を持ち続けている（導線の付け忘れ検出）。
 *
 * 手法（kimito §7 の踏襲 + 本リポの CSP 事情）:
 *   - 実際の X 認可は bot 対策で自動化できないため、x.com / twitter.com への
 *     リクエストは route intercept で全て 204 fulfill する。204 の
 *     トップレベルナビゲーションはブラウザが中止するのでページは sign-in に
 *     残り、X 側にも一切届かない（レート制限を踏まない）。
 *   - kimito 版の「fake X ボタン + fetch で試行を記録」は使わない。本番 CSP の
 *     connect-src に x.com が無く、fetch はネットワーク到達前に遮断されて
 *     route に届かないため（2026-07-04 実測）。本物の Clerk ボタンへの click →
 *     実ナビゲーションを検証する方が本番に忠実で、CSP の影響も受けない。
 *
 * ⚠️ このテストの URL を手書きしないこと。アプリの CTA が使う定数
 *    （lib/clerk-route.ts）をそのまま import するのが正。QA ツールが実導線と
 *    違う URL を叩いていたせいで「1タップになっていない」と誤認した事故が
 *    2026-07-04 に実際に起きている（docs/qa-toolkit-design.md §4）。
 */
import { expect, test, type Page } from "@playwright/test";
import { SIGN_IN_AUTO_X_HREF, SIGN_IN_HREF } from "../../lib/clerk-route";

const gotoOpts = { waitUntil: "domcontentloaded" as const };

// components/auth/auto-advance-to-x.tsx と同じ値（変えたらテストも追随する）
const COOLDOWN_KEY = "surechigai:auto-x-last-fired-at";
const AUTO_ADVANCE_TIMEOUT_MS = 9_000;

// Clerk のマウント（2〜4秒）+ AutoAdvanceToX の監視窓（9秒）+ ばらつき余裕。
// これを超えて OAuth 開始が試行されない場合、実ユーザーにとっても
// 1タップ導線は壊れている。
const ONE_TAP_BUDGET_MS = 20_000;

/**
 * X 方向のナビゲーション/リクエストを実際に飛ばさずに記録する。
 * 返り値の配列に、試行された URL が push される。
 * 204 fulfill のためトップレベルナビゲーションは中止され、ページは元の
 * sign-in に残る（後続の URL 検証がそのまま続けられる）。
 */
async function blockXOauthNavigation(page: Page): Promise<string[]> {
  const oauthRequests: string[] = [];
  const handler = async (
    route: Parameters<Parameters<Page["route"]>[1]>[0],
  ) => {
    oauthRequests.push(route.request().url());
    await route.fulfill({
      status: 204,
      contentType: "text/plain",
      body: "blocked by login-one-tap-x.spec.ts",
    });
  };
  await page.route("https://x.com/**", handler);
  await page.route("https://twitter.com/**", handler);
  return oauthRequests;
}

test.describe("1タップXログイン導線（AutoAdvanceToX）", () => {
  test("auto=x 付き sign-in はユーザー操作なしで X の OAuth 開始まで進む", async ({
    page,
  }) => {
    const oauthRequests = await blockXOauthNavigation(page);

    await page.goto(SIGN_IN_AUTO_X_HREF, gotoOpts);
    await expect(page.locator("body")).toBeVisible();

    // 1タップ進行オーバーレイ（AutoAdvanceToX）が出る
    await expect(page.getByText(/Xの画面へ進んでいます/)).toBeVisible({
      timeout: 15_000,
    });

    // ユーザー操作ゼロで、Clerk の X ボタンが自動 click され、
    // x.com 方向の OAuth 開始ナビゲーションが試行されること
    await expect
      .poll(() => oauthRequests.length, { timeout: ONE_TAP_BUDGET_MS })
      .toBeGreaterThan(0);
    expect(oauthRequests[0]).toMatch(/^https:\/\/(x|twitter)\.com\//);

    // ワンショット消費: click 時点で auto=x は URL から除去される
    expect(page.url()).not.toContain("auto=x");
  });

  test("auto=x なしの sign-in は勝手に OAuth を開始しない", async ({
    page,
  }) => {
    const oauthRequests = await blockXOauthNavigation(page);

    await page.goto(SIGN_IN_HREF, gotoOpts);
    await expect(page.locator("body")).toBeVisible();

    // オーバーレイは出ない
    await expect(page.getByText(/Xの画面へ進んでいます/)).toHaveCount(0);

    // Clerk の X ボタンが表示されたまま（= 2タップの通常画面）で、
    // 自動 click は発生しない
    const xButton = page
      .locator(
        [
          ".cl-socialButtonsBlockButton__x",
          ".cl-socialButtonsIconButton__x",
          ".cl-socialButtonsBlockButton__twitter",
          ".cl-socialButtonsIconButton__twitter",
        ].join(", "),
      )
      .first();
    await expect(xButton).toBeVisible({ timeout: 20_000 });

    await page.waitForTimeout(2_000);
    expect(oauthRequests.length).toBe(0);
  });

  test("クールダウン中の再訪では再発火しない（連続リロード暴走の封殺）", async ({
    page,
  }) => {
    const oauthRequests = await blockXOauthNavigation(page);

    await page.goto(SIGN_IN_AUTO_X_HREF, gotoOpts);
    await expect
      .poll(() => oauthRequests.length, { timeout: ONE_TAP_BUDGET_MS })
      .toBeGreaterThan(0);
    const firedCount = oauthRequests.length;

    // クールダウン時刻を「未来」に置いてから再訪する。
    // 実時刻のままだと 2 回目のページロードが COOLDOWN_MS(3秒) を超えたときに
    // 正当に再発火してしまい flaky になるため、判定を決定的にする。
    await page.evaluate(
      (key) => sessionStorage.setItem(key, String(Date.now() + 10_000)),
      COOLDOWN_KEY,
    );
    await page.goto(SIGN_IN_AUTO_X_HREF, gotoOpts);
    await page.waitForTimeout(AUTO_ADVANCE_TIMEOUT_MS + 2_000);

    // クールダウンが効いていれば OAuth 試行は増えない
    expect(oauthRequests.length).toBe(firedCount);
  });

  test("ゲストホームの CTA は auto=x 付き（1タップ）URL を持つ", async ({
    page,
  }) => {
    await page.goto("/", gotoOpts);

    // メイン CTA（KimitoLoginCta: 「𝕏 1タップではじめる」）
    const mainCta = page
      .locator('a[aria-label="Xで1タップではじめる"]')
      .first();
    await expect(mainCta).toBeVisible({ timeout: 20_000 });
    const mainHref = await mainCta.getAttribute("href");
    expect(mainHref).toContain("/sign-in");
    expect(mainHref).toContain("redirect_url=");
    expect(mainHref).toContain("auto=x");

    // ヘッダー CTA（GuestHomeShellHeader: 「𝕏 1タップ」）
    const headerCta = page.locator('a[aria-label="Xでログイン"]').first();
    await expect(headerCta).toBeVisible();
    const headerHref = await headerCta.getAttribute("href");
    expect(headerHref).toContain("auto=x");
  });
});
