/**
 * API Offline Queue Management
 * 
 * オフライン時のリクエストをキューイングし、
 * ネットワーク復帰時に自動的に再送信する
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type { ApiRequestOptions, ApiResponse } from "./types";

// =============================================================================
// 定数
// =============================================================================

const QUEUE_KEY = "api_offline_queue";

// =============================================================================
// 型定義
// =============================================================================

interface QueuedRequest {
  id: string;
  endpoint: string;
  options: ApiRequestOptions;
  timestamp: number;
}

// =============================================================================
// 状態
// =============================================================================

let isProcessingQueue = false;
let networkListener: (() => void) | null = null;
let loggingEnabled = false;

// apiRequest関数への参照（循環参照を避けるため）
let apiRequestFn: (<T>(endpoint: string, options: ApiRequestOptions) => Promise<ApiResponse<T>>) | null = null;

// =============================================================================
// 設定
// =============================================================================

export function setQueueLogging(enabled: boolean): void {
  loggingEnabled = enabled;
}

export function setApiRequestFunction(fn: typeof apiRequestFn): void {
  apiRequestFn = fn;
}

// =============================================================================
// キュー操作
// =============================================================================

/**
 * オフラインキューにリクエストを追加
 */
export async function addToQueue(endpoint: string, options: ApiRequestOptions): Promise<string> {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queuedRequest: QueuedRequest = {
    id,
    endpoint,
    options,
    timestamp: Date.now(),
  };

  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedRequest[] = stored ? JSON.parse(stored) : [];
    queue.push(queuedRequest);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    if (loggingEnabled) {
      console.log(`[API Queue] Added request: ${endpoint} (ID: ${id})`);
    }
  } catch (error) {
    console.warn("[API Queue] Failed to add to queue:", error);
  }

  return id;
}

/**
 * オフラインキューを取得
 */
async function getQueue(): Promise<QueuedRequest[]> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("[API Queue] Failed to get queue:", error);
    return [];
  }
}

/**
 * オフラインキューからリクエストを削除
 */
async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn("[API Queue] Failed to remove from queue:", error);
  }
}

/**
 * オフラインキューを処理
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || !apiRequestFn) return;
  
  isProcessingQueue = true;
  
  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    if (loggingEnabled) {
      console.log(`[API Queue] Processing ${queue.length} queued requests`);
    }

    for (const request of queue) {
      try {
        // キューイングオプションを無効にして再送信
        const result = await apiRequestFn(request.endpoint, {
          ...request.options,
          queueWhenOffline: false,
        });

        if (result.ok) {
          await removeFromQueue(request.id);
          if (loggingEnabled) {
            console.log(`[API Queue] Successfully processed: ${request.endpoint}`);
          }
        }
      } catch (error) {
        console.warn(`[API Queue] Failed to process: ${request.endpoint}`, error);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

// =============================================================================
// ネットワーク監視
// =============================================================================

/**
 * ネットワーク状態の監視を開始
 */
export function startNetworkMonitoring(): void {
  if (networkListener) return;

  networkListener = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      if (loggingEnabled) {
        console.log("[API Network] Online - processing queue");
      }
      processQueue();
    } else {
      if (loggingEnabled) {
        console.log("[API Network] Offline");
      }
    }
  });
}

/**
 * ネットワーク状態の監視を停止
 */
export function stopNetworkMonitoring(): void {
  if (networkListener) {
    networkListener();
    networkListener = null;
  }
}

// =============================================================================
// ユーティリティ
// =============================================================================

/**
 * オフラインキューのサイズを取得
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * オフラインキューをクリア
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    if (loggingEnabled) {
      console.log("[API Queue] Cleared");
    }
  } catch (error) {
    console.warn("[API Queue] Failed to clear queue:", error);
  }
}
