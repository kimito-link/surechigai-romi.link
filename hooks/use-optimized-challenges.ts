/**
 * 最適化されたチャレンジデータフック
 * 
 * パフォーマンス最適化:
 * 1. 即座にキャッシュデータを表示（ローディングなし）
 * 2. バックグラウンドでAPIから最新データを取得
 * 3. 差分があれば静かに更新
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useNetworkStatus } from "@/hooks/use-offline-cache";
import { 
  getCachedData, 
  setCachedData, 
  PREFETCH_KEYS 
} from "@/lib/data-prefetch";

type FilterType = "all" | "solo" | "group";

interface Challenge {
  id: number;
  hostName: string;
  hostUsername: string | null;
  hostProfileImage: string | null;
  hostFollowersCount: number | null;
  title: string;
  description: string | null;
  goalType: string;
  goalValue: number;
  goalUnit: string;
  currentValue: number;
  eventType: string;
  eventDate: Date;
  venue: string | null;
  prefecture: string | null;
  status: string;
}

interface UseOptimizedChallengesResult {
  challenges: Challenge[];
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<void>;
  fetchNextPage: () => void;
}

export function useOptimizedChallenges(
  filter: FilterType = "all"
): UseOptimizedChallengesResult {
  const { isOffline } = useNetworkStatus();
  
  // 即座に表示するためのローカルキャッシュ
  const [cachedChallenges, setCachedChallenges] = useState<Challenge[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // APIからのデータ取得
  const {
    data: paginatedData,
    isLoading: isApiLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: apiRefetch,
  } = trpc.events.listPaginated.useInfiniteQuery(
    { limit: 20, filter },
    {
      enabled: !isOffline,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
      staleTime: 2 * 60 * 1000, // 2分
      // キャッシュがあれば即座に表示
      placeholderData: (previousData) => previousData,
    }
  );

  // APIデータをフラット化
  const apiChallenges = paginatedData?.pages.flatMap((page) => page.items) ?? [];

  // 初回ロード時にキャッシュから読み込み
  useEffect(() => {
    const loadCache = async () => {
      const cached = await getCachedData<Challenge[]>(PREFETCH_KEYS.CHALLENGES);
      if (cached) {
        setCachedChallenges(cached.data);
        setIsStale(cached.isStale);
        setIsInitialLoad(false);
      }
    };
    loadCache();
  }, []);

  // APIデータが取得できたらキャッシュを更新
  useEffect(() => {
    if (apiChallenges.length > 0) {
      setCachedChallenges(apiChallenges);
      setCachedData(PREFETCH_KEYS.CHALLENGES, apiChallenges);
      setIsStale(false);
      setIsInitialLoad(false);
    }
  }, [apiChallenges]);

  // リフレッシュ処理
  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await apiRefetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [apiRefetch]);

  // ローディング状態の判定
  // キャッシュがあればローディングを表示しない
  const isLoading = isInitialLoad && cachedChallenges.length === 0 && isApiLoading;

  // 表示するデータ（キャッシュ優先、APIデータがあれば上書き）
  const challenges = apiChallenges.length > 0 ? apiChallenges : cachedChallenges;

  return {
    challenges,
    isLoading,
    isRefreshing,
    isStale,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  };
}
