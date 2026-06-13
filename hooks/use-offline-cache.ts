import { useEffect, useState, useCallback } from "react";
import {
  fetchWithCache,
  isOnline,
  addNetworkListener,
  CacheOptions,
} from "@/lib/offline-cache";

interface UseCachedQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fromCache: boolean;
  isStale: boolean;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

/**
 * オフラインキャッシュ対応のデータフェッチフック
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
): UseCachedQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const { enabled = true, ...cacheOptions } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await fetchWithCache(key, fetcher, cacheOptions);
      setData(result.data);
      setFromCache(result.fromCache);
      setIsStale(result.isStale);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, enabled, cacheOptions]);

  // 初回フェッチ
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ネットワーク状態の監視
  useEffect(() => {
    const checkOnline = async () => {
      const online = await isOnline();
      setIsOffline(!online);
    };
    checkOnline();

    const unsubscribe = addNetworkListener((connected) => {
      setIsOffline(!connected);
      // オンラインに戻ったら自動的に再フェッチ
      if (connected && isStale) {
        fetchData();
      }
    });

    return unsubscribe;
  }, [fetchData, isStale]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isError,
    error,
    fromCache,
    isStale,
    isOffline,
    refetch,
  };
}

/**
 * ネットワーク状態を監視するフック
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const checkOnline = async () => {
      const online = await isOnline();
      setIsConnected(online);
    };
    checkOnline();

    const unsubscribe = addNetworkListener((connected) => {
      if (!connected) {
        setWasOffline(true);
      }
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    isOffline: !isConnected,
    wasOffline,
    resetWasOffline: () => setWasOffline(false),
  };
}
