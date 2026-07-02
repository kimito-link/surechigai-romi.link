import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { attachSmokeMonitor, waitForAppHydration } from "./smoke-monitor";
import { FATAL_ERROR_PATTERNS, type AuditRoute } from "./audit-routes";

export type AuditResult = {
  path: string;
  label: string;
  pass: boolean;
  errorKind?: "fatal_ui" | "expect_text" | "console" | "pageerror" | "http";
  detail?: string;
};

/** 画面中央付近に致命的エラー UI が無いこと */
export async function assertNoFatalErrorUi(page: Page): Promise<void> {
  for (const pattern of FATAL_ERROR_PATTERNS) {
    const fatal = page.getByText(pattern);
    const count = await fatal.count();
    if (count === 0) continue;
    const visible = await fatal.first().isVisible().catch(() => false);
    if (visible) {
      const box = await fatal.first().boundingBox();
      const vp = page.viewportSize();
      if (box && vp) {
        const centerY = box.y + box.height / 2;
        const inMainViewport = centerY > 80 && centerY < vp.height - 80;
        expect(
          inMainViewport,
          `致命的エラー UI が表示されています: ${pattern}`,
        ).toBe(false);
      }
    }
  }
}

/** 固定ヘッダー下に主要コンテンツが隠れていないか（簡易ヒューリスティック） */
export async function assertHeaderNotOverlappingContent(
  page: Page,
  expectText: RegExp,
): Promise<void> {
  const header = page.locator('[role="header"]').first();
  const headerBox = await header.boundingBox().catch(() => null);
  const minContentY = headerBox ? headerBox.y + headerBox.height - 4 : 68;

  const candidates = page.getByText(expectText);
  const count = await candidates.count();

  let targetBox: { x: number; y: number; width: number; height: number } | null = null;

  for (let i = 0; i < count; i++) {
    const el = candidates.nth(i);
    const visible = await el.isVisible().catch(() => false);
    if (!visible) continue;

    const insideHeader = await el
      .evaluate((node) => {
        let current: Element | null = node;
        while (current) {
          if (current.getAttribute("role") === "header") return true;
          current = current.parentElement;
        }
        return false;
      })
      .catch(() => false);
    if (insideHeader) continue;

    targetBox = await el.boundingBox();
    if (targetBox) break;
  }

  expect(targetBox, `本文に期待テキスト ${expectText} が見つかりません`).not.toBeNull();
  if (targetBox) {
    expect(
      targetBox.y,
      `コンテンツがヘッダー下に隠れている可能性 (y=${targetBox.y}, headerBottom=${minContentY})`,
    ).toBeGreaterThan(minContentY);
  }
}

export async function auditRoute(
  page: Page,
  route: AuditRoute,
  options?: { screenshotName?: string; skipSmokeClean?: boolean },
): Promise<AuditResult> {
  const monitor = attachSmokeMonitor(page);
  try {
    await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("body", { timeout: 15000 });
    const isStaticPage = route.path.startsWith("/lp") || route.skipSmokeClean;
    if (!isStaticPage) {
      await waitForAppHydration(page, 25000);
    }
    await page.waitForTimeout(isStaticPage ? 400 : 600);

    await assertNoFatalErrorUi(page);
    if (!route.skipHeaderOverlap) {
      await assertHeaderNotOverlappingContent(page, route.expectText);
    } else if (route.path === "/sign-in") {
      expect(page.url()).toMatch(/sign-in/);
      await expect(page.locator("body")).toBeVisible();
    } else {
      await expect(page.locator("body")).toBeVisible();
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).toMatch(route.expectText);
    }

    if (!options?.skipSmokeClean) {
      await monitor.assertClean();
    }

    if (options?.screenshotName) {
      await page.screenshot({
        path: `test-results/audit/${options.screenshotName}.png`,
        fullPage: true,
      });
    }

    return { path: route.path, label: route.label, pass: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let errorKind: AuditResult["errorKind"] = "expect_text";
    if (msg.includes("console.error")) errorKind = "console";
    else if (msg.includes("pageerror")) errorKind = "pageerror";
    else if (msg.includes("HTTP errors")) errorKind = "http";
    else if (msg.includes("致命的エラー")) errorKind = "fatal_ui";

    if (options?.screenshotName) {
      await page
        .screenshot({
          path: `test-results/audit/${options.screenshotName}-FAIL.png`,
          fullPage: true,
        })
        .catch(() => {});
    }

    return {
      path: route.path,
      label: route.label,
      pass: false,
      errorKind,
      detail: msg.slice(0, 500),
    };
  }
}
