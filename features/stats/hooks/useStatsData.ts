/**
 * useStatsData Hook
 * 統計画面のデータ取得・状態管理
 */

import { trpc } from "@/lib/trpc";
import type { UserStats } from "../types";

interface UseStatsDataReturn {
  // Data
  userStats: UserStats | undefined;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isAuthError: boolean;
  
  // Actions
  refetch: () => void;
}

export function useStatsData(): UseStatsDataReturn {
  const { data: userStats, isLoading, isError, error, refetch } = trpc.stats.getUserStats.useQuery();
  const errorMessage = error?.message ?? "";
  const isAuthError = /please login|not authenticated|unauthorized|10001/i.test(errorMessage);

  return {
    userStats: (isAuthError ? undefined : userStats) as UserStats | undefined,
    isLoading,
    isError: isAuthError ? false : isError,
    error: isAuthError ? null : (error as Error | null),
    isAuthError,
    refetch,
  };
}
