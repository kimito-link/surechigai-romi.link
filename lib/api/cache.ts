/**
 * API Cache Management
 * 
 * メモリキャッシュとAsyncStorageを使用したキャッシュ管理
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// =============================================================================
// 定数
// =============================================================================

export const CACHE_PREFIX = "api_cache_";

// =============================================================================
// 型定義
// =============================================================================

/**
 * キャッシュ設定
 */
export interface CacheConfig {
  /** キャッシュを有効にするか。デフォルト: false */
  enabled?: boolean;
  /** キャッシュの有効期限（ミリ秒）。デフォルト: 300000 (5分) */
  ttl?: number;
  /** キャッシュキー（指定しない場合はエンドポイントから自動生成） */
  key?: string;
  /** オフライン時にキャッシュを使用するか。デフォルト: true */
  useWhenOffline?: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// =============================================================================
// メモリキャッシュ
// =============================================================================

const memoryCache = new Map<string, CacheEntry<unknown>>();

// =============================================================================
// ログ設定（client.tsから注入）
// =============================================================================

let loggingEnabled = false;

export function setCacheLogging(enabled: boolean): void {
  loggingEnabled = enabled;
}

// =============================================================================
// キャッシュ操作
// =============================================================================

/**
 * キャッシュキーを生成
 */
export function generateCacheKey(endpoint: string, body?: unknown): string {
  const bodyHash = body ? JSON.stringify(body) : "";
  return `${CACHE_PREFIX}${endpoint}_${bodyHash}`;
}

/**
 * キャッシュからデータを取得
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  // まずメモリキャッシュを確認
  const memCached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memCached && memCached.expiresAt > Date.now()) {
    if (loggingEnabled) {
      console.log(`[API Cache] Memory hit: ${key}`);
    }
    return memCached.data;
  }

  // メモリキャッシュにない場合はAsyncStorageを確認
  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const { data, expiresAt } = JSON.parse(stored) as CacheEntry<T>;
      if (expiresAt > Date.now()) {
        // メモリキャッシュにも保存
        memoryCache.set(key, { data, expiresAt });
        if (loggingEnabled) {
          console.log(`[API Cache] Storage hit: ${key}`);
        }
        return data;
      } else {
        // 期限切れなので削除
        await AsyncStorage.removeItem(key);
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.warn("[API Cache] Failed to read from cache:", error);
  }

  return null;
}

/**
 * キャッシュにデータを保存
 */
export async function saveToCache<T>(key: string, data: T, ttl: number): Promise<void> {
  const expiresAt = Date.now() + ttl;
  
  // メモリキャッシュに保存
  memoryCache.set(key, { data, expiresAt });

  // AsyncStorageにも保存
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, expiresAt }));
    if (loggingEnabled) {
      console.log(`[API Cache] Saved: ${key} (TTL: ${ttl}ms)`);
    }
  } catch (error) {
    console.warn("[API Cache] Failed to save to cache:", error);
  }
}

/**
 * キャッシュをクリア
 */
export async function clearApiCache(): Promise<void> {
  // メモリキャッシュをクリア
  memoryCache.clear();

  // AsyncStorageからキャッシュを削除
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    if (loggingEnabled) {
      console.log(`[API Cache] Cleared ${cacheKeys.length} items`);
    }
  } catch (error) {
    console.warn("[API Cache] Failed to clear cache:", error);
  }
}

/**
 * 特定のキャッシュを削除
 */
export async function invalidateCache(key: string): Promise<void> {
  memoryCache.delete(key);
  try {
    await AsyncStorage.removeItem(key);
    if (loggingEnabled) {
      console.log(`[API Cache] Invalidated: ${key}`);
    }
  } catch (error) {
    console.warn("[API Cache] Failed to invalidate cache:", error);
  }
}

/**
 * パターンに一致するキャッシュを削除
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  // メモリキャッシュから削除
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }

  // AsyncStorageから削除
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    if (matchingKeys.length > 0) {
      await AsyncStorage.multiRemove(matchingKeys);
      if (loggingEnabled) {
        console.log(`[API Cache] Invalidated ${matchingKeys.length} items matching: ${pattern}`);
      }
    }
  } catch (error) {
    console.warn("[API Cache] Failed to invalidate cache by pattern:", error);
  }
}
