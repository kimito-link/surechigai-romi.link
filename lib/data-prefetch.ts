/**
 * データプリフェッチとキャッシュ最適化
 * 
 * パフォーマンス改善のための戦略:
 * 1. 初期データをAsyncStorageにキャッシュ
 * 2. アプリ起動時にキャッシュを即座に表示
 * 3. バックグラウンドでAPIから最新データを取得
 * 4. 差分があれば更新
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// キャッシュキー
export const PREFETCH_KEYS = {
  CHALLENGES: "prefetch:challenges",
  CHALLENGES_TIMESTAMP: "prefetch:challenges:timestamp",
  CATEGORIES: "prefetch:categories",
} as const;

// v5.36: キャッシュ期間を延長。2回目以降の表示を瞬時に
// キャッシュの有効期限（30分）
const CACHE_TTL = 30 * 60 * 1000;

// 軽量キャッシュの有効期限（5分）- 即座に表示しつつバックグラウンドで更新
const STALE_WHILE_REVALIDATE_TTL = 5 * 60 * 1000;

export interface CachedData<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

/**
 * キャッシュからデータを取得
 */
export async function getCachedData<T>(key: string): Promise<CachedData<T> | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    const timestampStr = await AsyncStorage.getItem(`${key}:timestamp`);
    
    if (!cached || !timestampStr) return null;
    
    const data = JSON.parse(cached) as T;
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const age = now - timestamp;
    
    // キャッシュが完全に期限切れかどうか
    if (age > CACHE_TTL) {
      return null;
    }
    
    // stale-while-revalidate: 古いがまだ使える
    const isStale = age > STALE_WHILE_REVALIDATE_TTL;
    
    return { data, timestamp, isStale };
  } catch (error) {
    console.warn("[Prefetch] Failed to get cached data:", error);
    return null;
  }
}

/**
 * データをキャッシュに保存
 */
export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    await AsyncStorage.setItem(`${key}:timestamp`, Date.now().toString());
  } catch (error) {
    console.warn("[Prefetch] Failed to set cached data:", error);
  }
}

/**
 * キャッシュをクリア
 */
export async function clearCachedData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem(`${key}:timestamp`);
  } catch (error) {
    console.warn("[Prefetch] Failed to clear cached data:", error);
  }
}

/**
 * 全てのプリフェッチキャッシュをクリア
 */
export async function clearAllPrefetchCache(): Promise<void> {
  const keys = Object.values(PREFETCH_KEYS);
  for (const key of keys) {
    await clearCachedData(key);
  }
}
