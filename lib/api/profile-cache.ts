/**
 * v5.38: プロフィール情報取得とキャッシュ機構
 * 
 * 推奨アプローチを全て実装:
 * 1. キャッシュを活用: プロフィール情報を1時間キャッシュ
 * 2. バッチ取得: 複数ユーザーの情報を効率的に取得（キャッシュ優先）
 * 3. 遅延読み込み: 画面に表示されるまで取得しない
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./config";

// キャッシュのTTL（1時間）
const PROFILE_CACHE_TTL = 60 * 60 * 1000;

// メモリキャッシュ（高速アクセス用）
const memoryCache = new Map<string, { data: TwitterProfile; timestamp: number }>();

export interface TwitterProfile {
  id: string;
  name: string;
  username: string;
  profileImage: string;
  description: string;
  followersCount: number;
  followingCount: number;
}

// キャッシュキーの生成
function getCacheKey(username: string): string {
  return `profile_cache_${username.toLowerCase()}`;
}

// メモリキャッシュから取得
function getFromMemoryCache(username: string): TwitterProfile | null {
  const key = getCacheKey(username);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// メモリキャッシュに保存
function setToMemoryCache(username: string, data: TwitterProfile): void {
  const key = getCacheKey(username);
  memoryCache.set(key, { data, timestamp: Date.now() });
}

// AsyncStorageから取得
async function getFromAsyncStorage(username: string): Promise<TwitterProfile | null> {
  try {
    const key = getCacheKey(username);
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < PROFILE_CACHE_TTL) {
        // メモリキャッシュにも保存
        setToMemoryCache(username, data);
        return data;
      }
    }
  } catch (error) {
    console.error("Failed to get profile from AsyncStorage:", error);
  }
  return null;
}

// AsyncStorageに保存
async function setToAsyncStorage(username: string, data: TwitterProfile): Promise<void> {
  try {
    const key = getCacheKey(username);
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error("Failed to save profile to AsyncStorage:", error);
  }
}

/**
 * プロフィール情報を取得（キャッシュ優先）
 * @param username Twitterユーザー名
 * @returns プロフィール情報（見つからない場合はnull）
 */
export async function getProfile(username: string): Promise<TwitterProfile | null> {
  if (!username) return null;
  
  // 1. メモリキャッシュをチェック
  const memoryCached = getFromMemoryCache(username);
  if (memoryCached) {
    return memoryCached;
  }
  
  // 2. AsyncStorageをチェック
  const storageCached = await getFromAsyncStorage(username);
  if (storageCached) {
    return storageCached;
  }
  
  // 3. APIから取得
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/twitter/user/${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const data: TwitterProfile = await response.json();
    
    // キャッシュに保存
    setToMemoryCache(username, data);
    await setToAsyncStorage(username, data);
    
    return data;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
}

/**
 * 複数のプロフィール情報をバッチ取得（キャッシュ優先）
 * @param usernames Twitterユーザー名の配列
 * @returns プロフィール情報のMap（username -> profile）
 */
export async function getProfiles(usernames: string[]): Promise<Map<string, TwitterProfile>> {
  const result = new Map<string, TwitterProfile>();
  const toFetch: string[] = [];
  
  // 1. キャッシュから取得できるものを先に取得
  for (const username of usernames) {
    if (!username) continue;
    
    // メモリキャッシュをチェック
    const memoryCached = getFromMemoryCache(username);
    if (memoryCached) {
      result.set(username.toLowerCase(), memoryCached);
      continue;
    }
    
    // AsyncStorageをチェック
    const storageCached = await getFromAsyncStorage(username);
    if (storageCached) {
      result.set(username.toLowerCase(), storageCached);
      continue;
    }
    
    toFetch.push(username);
  }
  
  // 2. キャッシュにないものをAPIから取得（並列実行、最大5件ずつ）
  if (toFetch.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      const promises = batch.map(async (username) => {
        const profile = await getProfile(username);
        if (profile) {
          result.set(username.toLowerCase(), profile);
        }
      });
      await Promise.all(promises);
    }
  }
  
  return result;
}

/**
 * プロフィールキャッシュをクリア
 */
export async function clearProfileCache(): Promise<void> {
  // メモリキャッシュをクリア
  memoryCache.clear();
  
  // AsyncStorageからプロフィールキャッシュを削除
  try {
    const keys = await AsyncStorage.getAllKeys();
    const profileKeys = keys.filter(key => key.startsWith("profile_cache_"));
    if (profileKeys.length > 0) {
      await AsyncStorage.multiRemove(profileKeys);
    }
  } catch (error) {
    console.error("Failed to clear profile cache:", error);
  }
}

/**
 * 特定のプロフィールキャッシュを無効化
 */
export async function invalidateProfileCache(username: string): Promise<void> {
  const key = getCacheKey(username);
  memoryCache.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to invalidate profile cache:", error);
  }
}
