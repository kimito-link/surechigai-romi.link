import { useEffect, useState, useCallback } from "react";
import {
  SyncStatus,
  addSyncListener,
  getSyncStatus,
  processQueue,
  retryFailedItems,
  clearSyncQueue,
  getPendingCount,
} from "@/lib/offline-sync";

/**
 * オフライン同期状態を管理するフック
 */
export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  });

  useEffect(() => {
    // 初期状態を取得
    getSyncStatus().then(setStatus);

    // 状態変更をリッスン
    const unsubscribe = addSyncListener(setStatus);
    return unsubscribe;
  }, []);

  const sync = useCallback(async () => {
    await processQueue();
  }, []);

  const retry = useCallback(async () => {
    await retryFailedItems();
  }, []);

  const clear = useCallback(async () => {
    await clearSyncQueue();
    setStatus(prev => ({ ...prev, pendingCount: 0, lastError: null }));
  }, []);

  return {
    ...status,
    sync,
    retry,
    clear,
    hasPending: status.pendingCount > 0,
  };
}

/**
 * 保留中のアクション数を取得するフック
 */
export function usePendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getPendingCount().then(setCount);

    const unsubscribe = addSyncListener((status) => {
      setCount(status.pendingCount);
    });

    return unsubscribe;
  }, []);

  return count;
}
