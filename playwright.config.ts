import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Playwright E2E Test Configuration
 * 
 * スモークテスト + 管理画面の回帰テスト用設定
 * - console.error / 4xx-5xx / pageerror の自動検出
 * - 失敗時のtrace + screenshot + requestId保存
 */

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.E2E_BASE_URL ??
  "https://doin-challenge.com";
const localWorkers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : 1;

// Vercel Deployment Protection bypass header
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders: Record<string, string> = {};
if (vercelBypassSecret) {
  extraHTTPHeaders["x-vercel-protection-bypass"] = vercelBypassSecret;
}

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
    // Vercel Deployment Protection bypass
    extraHTTPHeaders,
  },

  timeout: 60000,
  expect: { timeout: 10000 },
  outputDir: "test-results",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
  ],

  // 開発サーバーの起動設定（CIでは事前に起動済みを想定）
  webServer: process.env.CI
    ? undefined
    : {
      command: "pnpm dev:metro",
      url: "http://localhost:8081",
      reuseExistingServer: true,
      timeout: 120000,
    },
});
