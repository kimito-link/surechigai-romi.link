import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

const CACHE_PREFIX = "offline_cache_";
const CACHE_EXPIRY_KEY = "cache_expiry_";
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

export interface CacheOptions {
  expiryMs?: number;
  forceRefresh?: boolean;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

/**
 * ネットワーク状態を監視するリスナー
 */
let networkListeners: ((isConnected: boolean) => void)[] = [];
let currentNetworkState: boolean | null = null;

/**
 * ネットワーク状態の初期化
 */
export async function initNetworkMonitoring(): Promise<void> {
  try {
    const state = await NetInfo.fetch();
    currentNetworkState = state.isConnected ?? false;

    NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      if (currentNetworkState !== isConnected) {
        currentNetworkState = isConnected;
        networkListeners.forEach(listener => listener(isConnected));
      }
    });
  } catch (error) {
    console.error("[OfflineCache] Failed to init network monitoring:", error);
    currentNetworkState = true; // デフォルトはオンライン
  }
}

/**
 * ネットワーク状態変更リスナーを追加
 */
export function addNetworkListener(listener: (isConnected: boolean) => void): () => void {
  networkListeners.push(listener);
  // 現在の状態を即座に通知
  if (currentNetworkState !== null) {
    listener(currentNetworkState);
  }
  return () => {
    networkListeners = networkListeners.filter(l => l !== listener);
  };
}

/**
 * 現在のネットワーク状態を取得
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    return true; // エラー時はオンラインと仮定
  }
}

/**
 * キャッシュキーを生成
 */
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * データをキャッシュに保存
 */
export async function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const cacheKey = getCacheKey(key);
    const expiryMs = options.expiryMs ?? DEFAULT_CACHE_DURATION;
    const expiry = Date.now() + expiryMs;

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(`${CACHE_EXPIRY_KEY}${key}`, expiry.toString());

    console.log(`[OfflineCache] Cached: ${key}`);
  } catch (error) {
    console.error(`[OfflineCache] Failed to cache ${key}:`, error);
  }
}

/**
 * キャッシュからデータを取得
 */
export async function getCache<T>(key: string): Promise<CachedData<T> | null> {
  try {
    const cacheKey = getCacheKey(key);
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const expiryStr = await AsyncStorage.getItem(`${CACHE_EXPIRY_KEY}${key}`);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
    const isStale = Date.now() > expiry;

    return {
      data: JSON.parse(cached) as T,
      timestamp: expiry - DEFAULT_CACHE_DURATION,
      isStale,
    };
  } catch (error) {
    console.error(`[OfflineCache] Failed to get cache ${key}:`, error);
    return null;
  }
}

/**
 * キャッシュを削除
 */
export async function clearCache(key: string): Promise<void> {
  try {
    const cacheKey = getCacheKey(key);
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(`${CACHE_EXPIRY_KEY}${key}`);
    console.log(`[OfflineCache] Cleared: ${key}`);
  } catch (error) {
    console.error(`[OfflineCache] Failed to clear cache ${key}:`, error);
  }
}

/**
 * すべてのキャッシュをクリア
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      key => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_KEY)
    );
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`[OfflineCache] Cleared all cache (${cacheKeys.length} items)`);
  } catch (error) {
    console.error("[OfflineCache] Failed to clear all cache:", error);
  }
}

/**
 * 期限切れのキャッシュをクリーンアップ
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const expiryKeys = keys.filter(key => key.startsWith(CACHE_EXPIRY_KEY));
    
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const expiryKey of expiryKeys) {
      const expiryStr = await AsyncStorage.getItem(expiryKey);
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (now > expiry + DEFAULT_CACHE_DURATION) {
          // 期限切れから24時間以上経過したものを削除
          const dataKey = expiryKey.replace(CACHE_EXPIRY_KEY, "");
          keysToRemove.push(getCacheKey(dataKey), expiryKey);
        }
      }
    }

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`[OfflineCache] Cleaned up ${keysToRemove.length / 2} expired items`);
    }
  } catch (error) {
    console.error("[OfflineCache] Failed to cleanup expired cache:", error);
  }
}

/**
 * キャッシュ付きデータフェッチ
 * オンライン時は新しいデータを取得してキャッシュを更新
 * オフライン時はキャッシュから取得
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; fromCache: boolean; isStale: boolean }> {
  const online = await isOnline();
  const cached = await getCache<T>(key);

  // オンラインで、キャッシュがないか期限切れか強制更新の場合
  if (online && (!cached || cached.isStale || options.forceRefresh)) {
    try {
      const freshData = await fetcher();
      await setCache(key, freshData, options);
      return { data: freshData, fromCache: false, isStale: false };
    } catch (error) {
      // フェッチ失敗時はキャッシュを返す
      if (cached) {
        console.log(`[OfflineCache] Fetch failed, using cache for ${key}`);
        return { data: cached.data, fromCache: true, isStale: cached.isStale };
      }
      throw error;
    }
  }

  // オフラインまたはキャッシュが有効な場合
  if (cached) {
    return { data: cached.data, fromCache: true, isStale: cached.isStale };
  }

  // キャッシュがなくオフラインの場合
  throw new Error("オフラインです。インターネット接続を確認してください。");
}

// チャレンジデータのキャッシュキー
export const CACHE_KEYS = {
  challenges: "challenges_list",
  challenge: (id: number) => `challenge_${id}`,
  participations: (challengeId: number) => `participations_${challengeId}`,
  userProfile: (userId: number) => `user_profile_${userId}`,
  notifications: (userId: number) => `notifications_${userId}`,
};
