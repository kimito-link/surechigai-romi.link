/**
 * 全ページ監査 — guest/auth × mobile/desktop
 * 実行: PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm exec playwright test --project=audit-guest-mobile --project=audit-guest-desktop
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { TAB_ROUTES, EXTRA_ROUTES } from "./helpers/audit-routes";
import { auditRoute, type AuditResult } from "./helpers/audit-assertions";
import { hasUsableAuthState, resolveAuthStatePath } from "./helpers/auth-state";

const authFile = resolveAuthStatePath();
// 空ファイル（ログイン未完了の残骸）はゲスト実行になるので「無い」扱いにする
const hasAuth = hasUsableAuthState(authFile);

const auditTag = process.env.AUDIT_TAG ?? "default";

function slugify(s: string): string {
  return s.replace(/\//g, "_").replace(/^_/, "") || "root";
}

async function runTabAudit(
  page: import("@playwright/test").Page,
  prefix: string,
): Promise<AuditResult[]> {
  fs.mkdirSync("test-results/audit", { recursive: true });
  const results: AuditResult[] = [];
  for (const route of TAB_ROUTES) {
    const name = `${prefix}-${auditTag}-${slugify(route.path)}`;
    results.push(
      await auditRoute(page, route, {
        screenshotName: name,
      }),
    );
  }
  return results;
}

async function runExtraAudit(
  page: import("@playwright/test").Page,
  prefix: string,
): Promise<AuditResult[]> {
  fs.mkdirSync("test-results/audit", { recursive: true });
  const results: AuditResult[] = [];
  for (const route of EXTRA_ROUTES) {
    const name = `${prefix}-extra-${auditTag}-${slugify(route.path)}`;
    results.push(
      await auditRoute(page, route, {
        screenshotName: name,
        skipSmokeClean: route.skipSmokeClean ?? route.path === "/lp/",
      }),
    );
  }
  return results;
}

function writeResultsJson(prefix: string, results: AuditResult[]) {
  const outPath = path.join("test-results", "audit", `${prefix}-${auditTag}-results.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  expect(
    failed,
    `${prefix} 監査 FAIL (${failed.length}/${results.length}):\n${failed
      .map((f) => `  ${f.path} [${f.errorKind}]: ${f.detail?.slice(0, 120)}`)
      .join("\n")}`,
  ).toEqual([]);
}

test.describe("full site audit — guest tabs", () => {
  test.setTimeout(180_000);

  test("6タブ監査", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("audit-auth"), "guest audit project only");
    const prefix = `guest-${testInfo.project.name}`;
    const tabResults = await runTabAudit(page, prefix);
    writeResultsJson(`${prefix}-tabs`, tabResults);
  });

  test("非タブ主要ルート", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("audit-auth"), "guest audit project only");
    const prefix = `guest-${testInfo.project.name}`;
    const extraResults = await runExtraAudit(page, prefix);
    writeResultsJson(`${prefix}-extra`, extraResults);
  });
});

test.describe("API health (no auth)", () => {
  test("version.json + health + public tRPC", async ({ request, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== "audit-guest-desktop", "single-project API health check");
    const apiBaseURL =
      process.env.E2E_API_BASE_URL ??
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      baseURL;

    const versionRes = await request.get(`${baseURL}/version.json`);
    expect(versionRes.status()).toBe(200);
    const version = await versionRes.json();
    expect(version.commitSha).toBeTruthy();

    const healthRes = await request.get(`${apiBaseURL}/api/health`);
    expect(healthRes.status()).toBe(200);

    const trpcBase = `${apiBaseURL}/api/trpc`;
    for (const proc of ["event.listUpcoming", "event.listLive"]) {
      const res = await request.get(`${trpcBase}/${proc}?input=${encodeURIComponent(JSON.stringify({}))}`);
      expect(res.status(), proc).toBeLessThan(500);
    }
  });
});

(hasAuth ? test.describe : test.describe.skip)("full site audit — authenticated tabs", () => {
  test.use({ storageState: authFile });

  test("6タブ監査（認証済み）", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("audit-auth"), "authenticated audit project only");
    const prefix = `auth-${testInfo.project.name}`;
    const tabResults = await runTabAudit(page, prefix);
    writeResultsJson(`${prefix}-tabs`, tabResults);
  });
});
