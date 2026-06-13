/**
 * useHomeData Hook
 * ホーム画面のデータ取得・キャッシュ管理
 */

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useNetworkStatus } from "@/hooks/use-offline-cache";
import { setCache, getCache, CACHE_KEYS } from "@/lib/offline-cache";
import { setCachedData, getCachedData, PREFETCH_KEYS } from "@/lib/data-prefetch";
import { useTabPrefetch } from "@/hooks/use-prefetch";
import { prefetchChallengeImages } from "@/lib/image-prefetch";
import { useFavorites } from "@/hooks/use-favorites";
import { sortByMomentum } from "../utils/momentum";
import type { Challenge, FilterType } from "@/types/challenge";

interface UseHomeDataOptions {
  filter: FilterType;
  searchQuery: string;
  categoryFilter: number | null;
}

interface UseHomeDataReturn {
  // Data
  challenges: Challenge[];
  searchResults: Challenge[];
  displayChallenges: Challenge[];
  featuredChallenge: Challenge | null;
  otherChallenges: Challenge[];
  rankedChallenges: Challenge[];
  top3: Challenge[];
  rest: Challenge[];
  categoriesData: any;
  
  // Tab counts
  tabCounts: {
    all: number;
    solo: number;
    group: number;
    favorite: number;
  };
  
  // Loading states
  hasData: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  /** @deprecated Use isInitialLoading instead */
  isLoading: boolean;
  /** @deprecated Use isInitialLoading instead */
  isDataLoading: boolean;
  isStaleData: boolean;
  refreshing: boolean;
  
  // Pagination
  hasNextPage: boolean;
  hasNextSearchPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingNextSearchPage: boolean;
  
  // Actions
  refetch: () => Promise<void>;
  refetchSearch: () => Promise<void>;
  fetchNextPage: () => void;
  fetchNextSearchPage: () => void;
  onRefresh: () => Promise<void>;
  
  // Favorites
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => void;
  
  // Offline
  isOffline: boolean;
}

export function useHomeData({
  filter,
  searchQuery,
  categoryFilter,
}: UseHomeDataOptions): UseHomeDataReturn {
  const { isOffline } = useNetworkStatus();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  // タブ切り替え前に他のタブのデータをプリフェッチ
  useTabPrefetch("home");
  
  const [cachedChallenges, setCachedChallenges] = useState<Challenge[] | null>(null);
  const [isStaleData, setIsStaleData] = useState(false);
  const [hasInitialCache, setHasInitialCache] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 初回ロード時にキャッシュから即座に表示
  useEffect(() => {
    const loadInitialCache = async () => {
      const cached = await getCachedData<Challenge[]>(PREFETCH_KEYS.CHALLENGES);
      if (cached && cached.data.length > 0) {
        setCachedChallenges(cached.data);
        setIsStaleData(cached.isStale);
        setHasInitialCache(true);
      }
    };
    loadInitialCache();
  }, []);

  // 無限スクロール対応のページネーションクエリ（検索対応）
  const {
    data: paginatedData,
    isLoading: isApiLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.events.listPaginated.useInfiniteQuery(
    { 
      limit: 20, 
      filter: filter as "all" | "solo" | "group",
      ...(searchQuery.length > 0 && { search: searchQuery }),
    } as any,
    {
      enabled: !isOffline,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
      staleTime: 2 * 60 * 1000,
    }
  );

  // ページネーションデータをフラットな配列に変換
  const apiChallenges = paginatedData?.pages.flatMap((page) => page.items) ?? [];
  
  // キャッシュ優先表示
  const challenges = apiChallenges.length > 0 ? apiChallenges : (cachedChallenges ?? []);
  const hasData = challenges.length > 0;
  
  // ローディング状態を分離
  // isInitialLoading: 初回ロード中（データなし）
  const isInitialLoading = isApiLoading && !hasData;
  
  // isRefreshing: データ保持したまま裏で更新中（ページネーション除く）
  const isRefreshing = isFetching && hasData && !isFetchingNextPage;
  
  // isLoadingMore: 無限スクロール中（リスト末尾）
  const isLoadingMore = isFetchingNextPage;
  
  // 後方互換性（非推奨）
  const isLoading = isInitialLoading;
  const isDataLoading = isInitialLoading;

  // 検索結果の無限スクロール対応
  const {
    data: searchPaginatedData,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasNextSearchPage,
    isFetchingNextPage: isFetchingNextSearchPage,
    refetch: refetchSearch,
  } = trpc.search.challengesPaginated.useInfiniteQuery(
    { query: searchQuery, limit: 20 },
    {
      enabled: searchQuery.length > 0 && !isOffline,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
    }
  );

  // 検索結果をフラットな配列に変換
  const searchResults = searchPaginatedData?.pages.flatMap((page) => page.items) ?? [];
  
  const { data: categoriesData } = trpc.categories.list.useQuery(undefined, {
    enabled: !isOffline,
  });

  // チャレンジデータをキャッシュに保存
  useEffect(() => {
    if (apiChallenges && apiChallenges.length > 0) {
      setCache(CACHE_KEYS.challenges, apiChallenges);
      setCachedData(PREFETCH_KEYS.CHALLENGES, apiChallenges);
      setIsStaleData(false);
    }
  }, [apiChallenges]);

  // チャレンジの画像をプリフェッチ
  useEffect(() => {
    if (challenges && challenges.length > 0) {
      prefetchChallengeImages(challenges.slice(0, 10));
    }
  }, [challenges]);

  // オフライン時はキャッシュから読み込み
  useEffect(() => {
    if (isOffline) {
      getCache<Challenge[]>(CACHE_KEYS.challenges).then((cached) => {
        if (cached) {
          setCachedChallenges(cached.data);
          setIsStaleData(cached.isStale);
        }
      });
    } else {
      setCachedChallenges(null);
    }
  }, [isOffline]);

  // オンライン時はAPIデータ、オフライン時はキャッシュデータを使用
  const effectiveChallenges = isOffline ? cachedChallenges : challenges;

  // フィルター適用
  const isSearching = searchQuery.length > 0;
  const displayChallenges = isSearching && searchResults 
    ? searchResults.filter((c: Challenge & { categoryId?: number | null }) => {
        if (filter === "favorites" && !isFavorite(c.id)) return false;
        if (filter !== "all" && filter !== "favorites" && c.eventType !== filter) return false;
        if (categoryFilter && c.categoryId !== categoryFilter) return false;
        return true;
      })
    : (effectiveChallenges?.filter((c: Challenge & { categoryId?: number | null }) => {
        if (filter === "favorites" && !isFavorite(c.id)) return false;
        if (filter !== "all" && filter !== "favorites" && c.eventType !== filter) return false;
        if (categoryFilter && c.categoryId !== categoryFilter) return false;
        return true;
      }) || []);

  // 注目のチャレンジ
  const featuredChallenge = useMemo(() => {
    if (!effectiveChallenges || effectiveChallenges.length === 0) return null;
    return effectiveChallenges.reduce((best, current) => {
      const bestProgress = best.currentValue / best.goalValue;
      const currentProgress = current.currentValue / current.goalValue;
      if (currentProgress > bestProgress || (currentProgress === bestProgress && current.currentValue > best.currentValue)) {
        return current;
      }
      return best;
    });
  }, [effectiveChallenges]);

  // チャレンジ一覧（注目のチャレンジを除く）
  const otherChallenges = useMemo(() => {
    if (!displayChallenges || displayChallenges.length === 0) return [];
    if (!featuredChallenge) return displayChallenges;
    return displayChallenges.filter(c => c.id !== featuredChallenge.id);
  }, [displayChallenges, featuredChallenge]);

  // 勢いスコアでソートしたランキング
  const rankedChallenges = useMemo(() => {
    return sortByMomentum(otherChallenges);
  }, [otherChallenges]);

  // Top3 + 残り
  const top3 = rankedChallenges.slice(0, 3);
  const rest = rankedChallenges.slice(3);

  // タブごとのカウント
  const tabCounts = useMemo(() => {
    const all = effectiveChallenges?.length || 0;
    const solo = effectiveChallenges?.filter(c => c.eventType === "solo").length || 0;
    const group = effectiveChallenges?.filter(c => c.eventType === "group").length || 0;
    const favorite = effectiveChallenges?.filter(c => isFavorite(c.id)).length || 0;
    return { all, solo, group, favorite };
  }, [effectiveChallenges, isFavorite]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return {
    // Data
    challenges,
    searchResults,
    displayChallenges,
    featuredChallenge,
    otherChallenges,
    rankedChallenges,
    top3,
    rest,
    categoriesData,
    tabCounts,
    
    // Loading states
    hasData,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    isLoading,
    isDataLoading,
    isStaleData,
    refreshing,
    
    // Pagination
    hasNextPage: hasNextPage ?? false,
    hasNextSearchPage: hasNextSearchPage ?? false,
    isFetchingNextPage,
    isFetchingNextSearchPage,
    
    // Actions
    refetch: async () => { await refetch(); },
    refetchSearch: async () => { await refetchSearch(); },
    fetchNextPage,
    fetchNextSearchPage,
    onRefresh,
    
    // Favorites
    isFavorite,
    toggleFavorite,
    
    // Offline
    isOffline,
  };
}
