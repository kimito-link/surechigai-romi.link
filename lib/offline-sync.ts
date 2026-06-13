import AsyncStorage from "@react-native-async-storage/async-storage";
import { addNetworkListener, isOnline } from "./offline-cache";

const SYNC_QUEUE_KEY = "offline_sync_queue";
const SYNC_STATUS_KEY = "offline_sync_status";

/**
 * 同期アクションの種類
 */
export type SyncActionType =
  | "participate"           // 参加表明
  | "cancel_participation"  // 参加取り消し
  | "create_challenge"      // チャレンジ作成
  | "update_challenge"      // チャレンジ更新
  | "update_profile";       // プロフィール更新

/**
 * 同期キューアイテム
 */
export interface SyncQueueItem {
  id: string;
  type: SyncActionType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  status: "pending" | "syncing" | "failed" | "completed";
}

/**
 * 同期状態
 */
export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

/**
 * 同期結果リスナー
 */
type SyncListener = (status: SyncStatus) => void;
let syncListeners: SyncListener[] = [];

/**
 * 同期ハンドラー（各アクションタイプごとの処理関数）
 */
type SyncHandler = (payload: Record<string, unknown>) => Promise<void>;
const syncHandlers: Map<SyncActionType, SyncHandler> = new Map();

/**
 * 同期ハンドラーを登録
 */
export function registerSyncHandler(type: SyncActionType, handler: SyncHandler): void {
  syncHandlers.set(type, handler);
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 同期キューを取得
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error("[OfflineSync] Failed to get sync queue:", error);
    return [];
  }
}

/**
 * 同期キューを保存
 */
async function saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("[OfflineSync] Failed to save sync queue:", error);
  }
}

/**
 * 同期状態を取得
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const queue = await getSyncQueue();
    const pendingCount = queue.filter(item => item.status === "pending" || item.status === "failed").length;
    const statusStr = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    const savedStatus = statusStr ? JSON.parse(statusStr) : {};
    
    return {
      isSyncing: savedStatus.isSyncing ?? false,
      pendingCount,
      lastSyncAt: savedStatus.lastSyncAt ?? null,
      lastError: savedStatus.lastError ?? null,
    };
  } catch (error) {
    console.error("[OfflineSync] Failed to get sync status:", error);
    return {
      isSyncing: false,
      pendingCount: 0,
      lastSyncAt: null,
      lastError: null,
    };
  }
}

/**
 * 同期状態を保存
 */
async function saveSyncStatus(status: Partial<SyncStatus>): Promise<void> {
  try {
    const current = await getSyncStatus();
    const newStatus = { ...current, ...status };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(newStatus));
    notifyListeners(newStatus);
  } catch (error) {
    console.error("[OfflineSync] Failed to save sync status:", error);
  }
}

/**
 * リスナーに通知
 */
function notifyListeners(status: SyncStatus): void {
  syncListeners.forEach(listener => listener(status));
}

/**
 * 同期状態リスナーを追加
 */
export function addSyncListener(listener: SyncListener): () => void {
  syncListeners.push(listener);
  // 現在の状態を即座に通知
  getSyncStatus().then(status => listener(status));
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

/**
 * アクションをキューに追加
 */
export async function enqueueAction(
  type: SyncActionType,
  payload: Record<string, unknown>
): Promise<string> {
  const item: SyncQueueItem = {
    id: generateId(),
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
  };

  const queue = await getSyncQueue();
  queue.push(item);
  await saveSyncQueue(queue);

  console.log(`[OfflineSync] Enqueued action: ${type} (${item.id})`);

  // オンラインなら即座に同期を試行
  const online = await isOnline();
  if (online) {
    processQueue();
  }

  const status = await getSyncStatus();
  notifyListeners(status);

  return item.id;
}

/**
 * キューからアイテムを削除
 */
async function removeFromQueue(id: string): Promise<void> {
  const queue = await getSyncQueue();
  const newQueue = queue.filter(item => item.id !== id);
  await saveSyncQueue(newQueue);
}

/**
 * キューアイテムを更新
 */
async function updateQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  const queue = await getSyncQueue();
  const index = queue.findIndex(item => item.id === id);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    await saveSyncQueue(queue);
  }
}

/**
 * 単一アイテムを同期
 */
async function syncItem(item: SyncQueueItem): Promise<boolean> {
  const handler = syncHandlers.get(item.type);
  if (!handler) {
    console.error(`[OfflineSync] No handler for action type: ${item.type}`);
    return false;
  }

  try {
    await updateQueueItem(item.id, { status: "syncing" });
    await handler(item.payload);
    await removeFromQueue(item.id);
    console.log(`[OfflineSync] Successfully synced: ${item.type} (${item.id})`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[OfflineSync] Failed to sync ${item.type} (${item.id}):`, errorMessage);
    
    await updateQueueItem(item.id, {
      status: "failed",
      retryCount: item.retryCount + 1,
      lastError: errorMessage,
    });
    
    return false;
  }
}

/**
 * キューを処理
 */
let isProcessing = false;
const MAX_RETRIES = 3;

export async function processQueue(): Promise<void> {
  if (isProcessing) {
    console.log("[OfflineSync] Already processing queue");
    return;
  }

  const online = await isOnline();
  if (!online) {
    console.log("[OfflineSync] Offline, skipping queue processing");
    return;
  }

  isProcessing = true;
  await saveSyncStatus({ isSyncing: true });

  try {
    const queue = await getSyncQueue();
    const pendingItems = queue.filter(
      item => (item.status === "pending" || item.status === "failed") && item.retryCount < MAX_RETRIES
    );

    console.log(`[OfflineSync] Processing ${pendingItems.length} items`);

    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      const success = await syncItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`[OfflineSync] Completed: ${successCount} success, ${failCount} failed`);

    await saveSyncStatus({
      isSyncing: false,
      lastSyncAt: Date.now(),
      lastError: failCount > 0 ? `${failCount}件の同期に失敗しました` : null,
    });
  } catch (error) {
    console.error("[OfflineSync] Queue processing error:", error);
    await saveSyncStatus({
      isSyncing: false,
      lastError: error instanceof Error ? error.message : "同期エラー",
    });
  } finally {
    isProcessing = false;
  }
}

/**
 * ネットワーク復帰時の自動同期を初期化
 */
export function initAutoSync(): () => void {
  console.log("[OfflineSync] Initializing auto sync");
  
  const unsubscribe = addNetworkListener((isConnected) => {
    if (isConnected) {
      console.log("[OfflineSync] Network restored, processing queue");
      processQueue();
    }
  });

  // 起動時にもキューを処理
  processQueue();

  return unsubscribe;
}

/**
 * 保留中のアクション数を取得
 */
export async function getPendingCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.filter(item => item.status === "pending" || item.status === "failed").length;
}

/**
 * 失敗したアイテムを再試行
 */
export async function retryFailedItems(): Promise<void> {
  const queue = await getSyncQueue();
  const failedItems = queue.filter(item => item.status === "failed");
  
  for (const item of failedItems) {
    await updateQueueItem(item.id, { status: "pending", retryCount: 0 });
  }
  
  await processQueue();
}

/**
 * キューをクリア
 */
export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  await saveSyncStatus({ pendingCount: 0, lastError: null });
  console.log("[OfflineSync] Queue cleared");
}
