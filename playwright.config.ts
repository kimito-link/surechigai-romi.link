import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Playwright E2E — 君斗りんくのすれ違ひ通信
 *
 * - public.smoke: 未ログインで主要タブを巡回
 * - trail-auth.smoke: .auth/auth-state.json がある場合のみ削除/公開/チェックイン
 * - save-auth-state: pnpm e2e:auth-save で手動実行（通常 e2e では除外）
 */

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.E2E_BASE_URL ??
  "http://localhost:8081";

const isLocalBase =
  baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

const localWorkers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : 1;

const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders: Record<string, string> = {};
if (vercelBypassSecret) {
  extraHTTPHeaders["x-vercel-protection-bypass"] = vercelBypassSecret;
}

const authStatePath = path.resolve(process.cwd(), ".auth/auth-state.json");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : localWorkers,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
    extraHTTPHeaders,
  },

  timeout: 60000,
  expect: { timeout: 10000 },
  outputDir: "test-results",

  projects: [
    {
      name: "public-smoke",
      testMatch: /public\.smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "trail-auth-smoke",
      testMatch: /trail-auth\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authStatePath,
      },
    },
    {
      name: "tab-instant-display",
      testMatch: /tab-instant-display\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tab-wait-investigation",
      testMatch: /tab-wait-investigation\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "save-auth",
      testMatch: /save-auth-state\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer:
    process.env.CI || !isLocalBase
      ? undefined
      : {
          command: "pnpm dev:metro",
          url: "http://localhost:8081",
          reuseExistingServer: true,
          timeout: 120000,
        },
});
