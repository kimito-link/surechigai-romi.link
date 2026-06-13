/**
 * 統計画面
 * ユーザーの統計情報を表示
 */

import {
  StatsLoadingState,
  StatsErrorState,
  StatsEmptyState,
  StatsContent,
  useStatsData,
} from "@/features/stats";

export default function StatsScreen() {
  const { userStats, isLoading, isError, error, refetch, isAuthError } = useStatsData();

  if (isLoading) {
    return <StatsLoadingState onRetry={refetch} />;
  }

  if (isAuthError) {
    return <StatsEmptyState message="ログインすると統計が表示されます。" />;
  }

  if (isError) {
    const errorMessage = error?.message || "統計データを読み込めませんでした";
    return <StatsErrorState errorMessage={errorMessage} onRetry={refetch} />;
  }

  if (!userStats) {
    return <StatsEmptyState />;
  }

  return <StatsContent userStats={userStats} />;
}
