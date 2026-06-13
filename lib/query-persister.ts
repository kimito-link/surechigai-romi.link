import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Persister, PersistedClient } from "@tanstack/react-query-persist-client";

/**
 * React QueryのキャッシュをAsyncStorageに永続化するためのPersister
 *
 * これにより、以下の機能が有効になります：
 * - オフライン時でもキャッシュデータを表示
 * - アプリ再起動後もキャッシュが保持される
 * - ネットワーク接続が復帰したら自動的に再検証
 *
 * シークレットモード対応: restoreClient にタイムアウトを設定し、
 * ストレージアクセスが遅延・失敗してもアプリがブロックされないようにする
 */
const STORAGE_KEY = "REACT_QUERY_OFFLINE_CACHE";
const RESTORE_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

export const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    try {
      const data = await withTimeout(AsyncStorage.getItem(STORAGE_KEY), RESTORE_TIMEOUT_MS);
      return data ? JSON.parse(data) : undefined;
    } catch {
      return undefined;
    }
  },
  removeClient: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
