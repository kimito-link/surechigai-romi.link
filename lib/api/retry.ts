/**
 * API Retry Logic
 * 
 * 指数バックオフによるリトライ機能
 */

import type { RetryConfig } from "./types";
import { DEFAULT_RETRY_CONFIG } from "./types";

// =============================================================================
// リトライ判定
// =============================================================================

/**
 * リトライ可能かどうかを判定
 */
export function shouldRetry(
  status: number, 
  attempt: number, 
  config: Required<RetryConfig>
): boolean {
  if (attempt >= config.maxRetries) return false;
  if (status === 0) return true; // ネットワークエラー
  return config.retryableStatuses.includes(status);
}

/**
 * リトライ遅延を計算（指数バックオフ）
 */
export function calculateDelay(
  attempt: number, 
  config: Required<RetryConfig>
): number {
  const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
  // ジッターを追加（±20%）
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * 指定時間待機
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リトライ設定をマージ
 */
export function mergeRetryConfig(config?: RetryConfig): Required<RetryConfig> {
  return { ...DEFAULT_RETRY_CONFIG, ...config };
}
