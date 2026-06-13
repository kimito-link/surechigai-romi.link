/**
 * API Logger
 * 
 * APIリクエスト/レスポンスのログ機能
 */

import type { ApiResponse, ApiRequestOptions } from "./types";

// =============================================================================
// 設定
// =============================================================================

let apiLoggingEnabled = __DEV__;

/**
 * APIログを有効/無効にする
 */
export function setApiLogging(enabled: boolean): void {
  apiLoggingEnabled = enabled;
}

/**
 * APIログが有効かどうかを取得
 */
export function isApiLoggingEnabled(): boolean {
  return apiLoggingEnabled;
}

// =============================================================================
// ログ関数
// =============================================================================

/**
 * APIリクエストをログ出力
 */
export function logRequest(
  method: string, 
  endpoint: string, 
  options?: ApiRequestOptions, 
  attempt?: number
): void {
  if (!apiLoggingEnabled) return;
  
  const attemptInfo = attempt && attempt > 1 ? ` (attempt ${attempt})` : "";
  console.log(`[API] ${method} ${endpoint}${attemptInfo}`, {
    headers: options?.headers,
    body: options?.body,
    timestamp: new Date().toISOString(),
  });
}

/**
 * APIレスポンスをログ出力
 */
export function logResponse<T>(
  method: string,
  endpoint: string,
  response: ApiResponse<T>,
  duration: number
): void {
  if (!apiLoggingEnabled) return;
  
  const logLevel = response.ok ? "log" : "error";
  const cacheInfo = response.fromCache ? " [CACHE]" : "";
  const queueInfo = response.queued ? " [QUEUED]" : "";
  console[logLevel](`[API] ${method} ${endpoint} → ${response.status}${cacheInfo}${queueInfo}`, {
    ok: response.ok,
    data: response.data,
    error: response.error,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * リトライログを出力
 */
export function logRetry(attempt: number, maxRetries: number, delay: number): void {
  if (!apiLoggingEnabled) return;
  console.log(`[API Retry] Waiting ${Math.round(delay)}ms before retry ${attempt}/${maxRetries}`);
}
