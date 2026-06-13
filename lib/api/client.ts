/**
 * API Client
 * 
 * fetch呼び出しのラッパーを提供し、
 * エラーハンドリング、ログ機能、リトライ、キャッシュ、オフラインサポートを一元管理
 * 
 * @see docs/API-ARCHITECTURE.md
 */

import { getApiBaseUrl } from "./config";
import NetInfo from "@react-native-community/netinfo";
import { getAuthToken } from "@/lib/auth-token";

// 分離したモジュールをインポート
import type { ApiResponse, ApiRequestOptions, RetryConfig } from "./types";
import { generateCacheKey, getFromCache, saveToCache, setCacheLogging } from "./cache";
import { addToQueue, setQueueLogging, setApiRequestFunction } from "./queue";
import { shouldRetry, calculateDelay, sleep, mergeRetryConfig } from "./retry";
import { setApiLogging, isApiLoggingEnabled, logRequest, logResponse, logRetry } from "./logger";

// 型とユーティリティを再エクスポート
export type { ApiResponse, ApiRequestOptions, RetryConfig, CacheConfig } from "./types";
export { ApiError } from "./types";
export { clearApiCache, invalidateCache, invalidateCacheByPattern } from "./cache";
export { startNetworkMonitoring, stopNetworkMonitoring, getQueueSize, clearQueue } from "./queue";
export { setApiLogging, isApiLoggingEnabled } from "./logger";
export { getErrorMessage, isApiSuccess, getErrorType } from "./errors";

// =============================================================================
// 初期化
// =============================================================================

// ログ設定を同期
function syncLoggingSettings(): void {
  const enabled = isApiLoggingEnabled();
  setCacheLogging(enabled);
  setQueueLogging(enabled);
}

// 初期同期
syncLoggingSettings();

// setApiLoggingをラップして全モジュールに伝播
const originalSetApiLogging = setApiLogging;
export { originalSetApiLogging as setApiLoggingInternal };

// =============================================================================
// コアAPI関数
// =============================================================================

/**
 * APIリクエストを実行する汎用関数
 * 
 * @param endpoint APIエンドポイント（/api/xxx形式）
 * @param options リクエストオプション
 * @returns APIレスポンス
 * 
 * @example
 * ```tsx
 * // GETリクエスト
 * const response = await apiRequest("/api/users");
 * 
 * // POSTリクエスト（リトライ付き）
 * const response = await apiRequest("/api/users", {
 *   method: "POST",
 *   body: { name: "John" },
 *   retry: { maxRetries: 3 },
 * });
 * 
 * // キャッシュ付きGETリクエスト
 * const response = await apiRequest("/api/users", {
 *   apiCache: { enabled: true, ttl: 60000 },
 * });
 * ```
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    timeout = 30000,
    logErrors = true,
    retry,
    apiCache,
    queueWhenOffline = false,
    ...fetchOptions
  } = options;

  const startTime = Date.now();
  const retryConfig = mergeRetryConfig(retry);
  const cacheKey = apiCache?.key || generateCacheKey(endpoint, body);

  // オンライン状態を確認
  const networkState = await NetInfo.fetch();
  const isOnline = networkState.isConnected ?? true;

  // オフライン時の処理
  if (!isOnline) {
    // キャッシュがあれば返す
    if (apiCache?.useWhenOffline !== false) {
      const cached = await getFromCache<T>(cacheKey);
      if (cached !== null) {
        const result: ApiResponse<T> = {
          ok: true,
          status: 200,
          data: cached,
          error: null,
          fromCache: true,
        };
        logResponse(method, endpoint, result, Date.now() - startTime);
        return result;
      }
    }

    // キューイングが有効なら追加
    if (queueWhenOffline && method !== "GET") {
      await addToQueue(endpoint, options);
      const result: ApiResponse<T> = {
        ok: false,
        status: 0,
        data: null,
        error: "オフラインです。ネットワーク復帰後に自動的に送信されます。",
        queued: true,
      };
      logResponse(method, endpoint, result, Date.now() - startTime);
      return result;
    }

    // オフラインエラーを返す
    const result: ApiResponse<T> = {
      ok: false,
      status: 0,
      data: null,
      error: "ネットワークに接続されていません。",
    };
    logResponse(method, endpoint, result, Date.now() - startTime);
    return result;
  }

  // キャッシュを確認（GETリクエストのみ）
  if (method === "GET" && apiCache?.enabled) {
    const cached = await getFromCache<T>(cacheKey);
    if (cached !== null) {
      const result: ApiResponse<T> = {
        ok: true,
        status: 200,
        data: cached,
        error: null,
        fromCache: true,
      };
      logResponse(method, endpoint, result, Date.now() - startTime);
      return result;
    }
  }

  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint}`;

  // リトライループ
  let lastResult: ApiResponse<T> | null = null;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = calculateDelay(attempt - 1, retryConfig);
      logRetry(attempt, retryConfig.maxRetries, delay);
      await sleep(delay);
    }

    // リクエストログ
    logRequest(method, endpoint, options, attempt + 1);

    // AbortControllerでタイムアウトを実装
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = new Headers(fetchOptions.headers as HeadersInit | undefined);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const authToken = await getAuthToken();
      if (authToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${authToken}`);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンスボディを取得
      let data: T | null = null;
      let errorMessage: string | null = null;

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          const json = await response.json();
          if (response.ok) {
            data = json as T;
          } else {
            errorMessage = json.error || json.message || `HTTP ${response.status}`;
          }
        } catch {
          errorMessage = "Invalid JSON response";
        }
      } else if (!response.ok) {
        errorMessage = `HTTP ${response.status}`;
      }

      const result: ApiResponse<T> = {
        ok: response.ok,
        status: response.status,
        data,
        error: errorMessage,
      };

      // 成功した場合はキャッシュに保存
      if (response.ok && method === "GET" && apiCache?.enabled && data !== null) {
        await saveToCache(cacheKey, data, apiCache.ttl || 300000);
      }

      // リトライ不要なら結果を返す
      if (!shouldRetry(response.status, attempt, retryConfig)) {
        const duration = Date.now() - startTime;
        logResponse(method, endpoint, result, duration);
        return result;
      }

      lastResult = result;
    } catch (error) {
      clearTimeout(timeoutId);

      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = `Request timeout after ${timeout}ms`;
        } else {
          errorMessage = error.message;
        }
      }

      const result: ApiResponse<T> = {
        ok: false,
        status: 0,
        data: null,
        error: errorMessage,
      };

      // リトライ不要なら結果を返す
      if (!shouldRetry(0, attempt, retryConfig)) {
        const duration = Date.now() - startTime;
        if (logErrors) {
          logResponse(method, endpoint, result, duration);
        }
        return result;
      }

      lastResult = result;
    }
  }

  // すべてのリトライが失敗した場合
  const duration = Date.now() - startTime;
  if (logErrors && lastResult) {
    logResponse(method, endpoint, lastResult, duration);
  }

  return lastResult || {
    ok: false,
    status: 0,
    data: null,
    error: "All retries failed",
  };
}

// キュー処理用にapiRequest関数を登録
setApiRequestFunction(apiRequest);

// =============================================================================
// 便利なショートカット関数
// =============================================================================

/**
 * GETリクエストを実行
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, "method" | "body">
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: "GET" });
}

/**
 * POSTリクエストを実行
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, "method">
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: "POST" });
}

/**
 * PUTリクエストを実行
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, "method">
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: "PUT" });
}

/**
 * DELETEリクエストを実行
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, "method">
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: "DELETE" });
}
