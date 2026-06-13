/**
 * useLoadingState Hook
 * ローディング状態の判定ロジックを共通化
 * 
 * 使用例:
 * ```tsx
 * const { data, isLoading, isFetching } = trpc.xxx.useQuery();
 * const loadingState = useLoadingState({
 *   isLoading,
 *   isFetching,
 *   hasData: !!data && data.length > 0,
 * });
 * 
 * if (loadingState.isInitialLoading) {
 *   return <ScreenLoadingState />;
 * }
 * ```
 */

interface UseLoadingStateOptions {
  /** 初回ロード中かどうか */
  isLoading: boolean;
  /** データ取得中かどうか（リフレッシュ含む） */
  isFetching: boolean;
  /** データが存在するかどうか */
  hasData: boolean;
  /** 無限スクロールで次のページを取得中かどうか（オプション） */
  isFetchingNextPage?: boolean;
}

interface UseLoadingStateReturn {
  /** 初回ロード中（データなし） */
  isInitialLoading: boolean;
  /** データ保持したまま裏で更新中 */
  isRefreshing: boolean;
  /** 無限スクロール中（次のページを取得中） */
  isLoadingMore: boolean;
}

export function useLoadingState({
  isLoading,
  isFetching,
  hasData,
  isFetchingNextPage = false,
}: UseLoadingStateOptions): UseLoadingStateReturn {
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isFetching && hasData && !isFetchingNextPage;
  const isLoadingMore = isFetchingNextPage || false;

  return {
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
  };
}
