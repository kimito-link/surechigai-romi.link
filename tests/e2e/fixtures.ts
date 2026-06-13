import { test as base, expect, Page } from "@playwright/test";

/**
 * E2E共通フィクスチャ
 * 
 * 全テストで以下を自動監視：
 * 1. console.error が出たら FAIL
 * 2. 4xx/5xx のネットワークレスポンスが出たら FAIL
 * 3. pageerror（未処理例外）が出たら FAIL
 * 4. 失敗時は requestId をログ出力
 */

// 許可するエラーパターン（既知の無害なエラー）
const ALLOWED_ERROR_PATTERNS = [
  /favicon\.ico/,
  /Failed to load resource.*favicon/,
  /ResizeObserver loop/,
  /Expo.*push token/,
  /Require cycles are allowed/,
];

// 許可する404パス（既知の無害な404）
const ALLOWED_404_PATHS = [
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.json",
];

interface CollectedError {
  type: "console" | "pageerror" | "network";
  message: string;
  url?: string;
  status?: number;
  requestId?: string;
}

// エラー収集用の拡張フィクスチャ
export const test = base.extend<{
  monitoredPage: Page;
  collectedErrors: CollectedError[];
}>({
  collectedErrors: async (_fixtures, use) => {
    const errors: CollectedError[] = [];
    await use(errors);
  },

  monitoredPage: async ({ page, collectedErrors }, use) => {
    // console.error を監視
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // 許可パターンに一致する場合はスキップ
        if (ALLOWED_ERROR_PATTERNS.some((pattern) => pattern.test(text))) {
          return;
        }
        collectedErrors.push({
          type: "console",
          message: text,
        });
      }
    });

    // pageerror（未処理例外）を監視
    page.on("pageerror", (error) => {
      const message = error.message || String(error);
      // 許可パターンに一致する場合はスキップ
      if (ALLOWED_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
        return;
      }
      collectedErrors.push({
        type: "pageerror",
        message,
      });
    });

    // ネットワークレスポンス（4xx/5xx）を監視
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400) {
        // 許可する404パスはスキップ
        const urlPath = new URL(url).pathname;
        if (status === 404 && ALLOWED_404_PATHS.some((path) => urlPath.endsWith(path))) {
          return;
        }

        // requestId を取得（ヘッダーから）
        const requestId = response.headers()["x-request-id"] || undefined;

        collectedErrors.push({
          type: "network",
          message: `HTTP ${status}`,
          url,
          status,
          requestId,
        });
      }
    });

    await use(page);
  },
});

// afterEach で収集したエラーをチェック
test.afterEach(async ({ collectedErrors }, testInfo) => {
  if (collectedErrors.length > 0) {
    // エラー詳細をログ出力
    console.error("\n=== Collected Errors ===");
    for (const error of collectedErrors) {
      console.error(`[${error.type}] ${error.message}`);
      if (error.url) console.error(`  URL: ${error.url}`);
      if (error.status) console.error(`  Status: ${error.status}`);
      if (error.requestId) console.error(`  RequestId: ${error.requestId}`);
    }
    console.error("========================\n");

    // テストを失敗させる
    const errorSummary = collectedErrors
      .map((e) => {
        let msg = `[${e.type}] ${e.message}`;
        if (e.requestId) msg += ` (requestId: ${e.requestId})`;
        return msg;
      })
      .join("\n");

    throw new Error(`E2E Test detected errors:\n${errorSummary}`);
  }
});

export { expect };
