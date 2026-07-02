import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** console.error で FAIL にしない既知パターン */
const ALLOWED_CONSOLE_ERROR = [
  /favicon\.ico/i,
  /ResizeObserver loop/i,
  /Expo push token/i,
  /Require cycles are allowed/i,
  /Failed to load resource.*404/i,
  /clerk.*development/i,
  /** デプロイ直後: 旧 HTML が新 chunk を参照して一時的に HTML が返る */
  /MIME type.*is not executable/i,
  /Refused to execute script.*_expo\/static/i,
];

/** 404 を許容するパス */
const ALLOWED_404_PATHS = [
  /favicon\.ico/,
  /apple-touch-icon/,
  /manifest\.json/,
];

export type SmokeMonitor = {
  assertClean: () => void;
};

/** ページ遷移中の console.error / pageerror / 想定外 4xx-5xx を収集 */
export function attachSmokeMonitor(page: Page): SmokeMonitor {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const httpErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ALLOWED_CONSOLE_ERROR.some((re) => re.test(text))) return;
    consoleErrors.push(text);
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;
    const url = response.url();
    if (status === 404 && ALLOWED_404_PATHS.some((re) => re.test(url))) return;
    // tRPC 未ログイン 401 は公開ページスモークでは許容
    if (status === 401 && url.includes("/api/trpc")) return;
    httpErrors.push(`${status} ${url}`);
  });

  return {
    assertClean: () => {
      expect(consoleErrors, `console.error:\n${consoleErrors.join("\n")}`).toEqual([]);
      expect(pageErrors, `pageerror:\n${pageErrors.join("\n")}`).toEqual([]);
      expect(httpErrors, `HTTP errors:\n${httpErrors.join("\n")}`).toEqual([]);
    },
  };
}

/** Expo Web の #root（または静的 LP の body）に本文が描画されるまで待つ */
export async function waitForAppHydration(page: Page, timeout = 25000): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      const el = root ?? document.body;
      if (!el) return false;
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      // 静的 LP は #root なし — body 全体で判定
      const minLen = root ? 40 : 20;
      return text.length > minLen;
    },
    { timeout },
  );
}

/** スモーク用: 遷移 → 本文表示待ち → 監視結果検証 */
export async function gotoSmokePage(
  page: Page,
  path: string,
  options?: { heading?: string | RegExp; timeout?: number; skipHydration?: boolean },
): Promise<SmokeMonitor> {
  const monitor = attachSmokeMonitor(page);
  const timeout = options?.timeout ?? 30000;
  await page.goto(path, { waitUntil: "domcontentloaded", timeout });
  await page.waitForSelector("body", { timeout: 15000 });
  if (!options?.skipHydration) {
    await waitForAppHydration(page, Math.min(timeout, 25000));
  }

  if (options?.heading) {
    await expect(page.getByText(options.heading).first()).toBeVisible({
      timeout: Math.max(timeout, 20000),
    });
  }

  await page.waitForTimeout(400);
  return monitor;
}

export const AUTH_STATE_PATH = ".auth/auth-state.json";
