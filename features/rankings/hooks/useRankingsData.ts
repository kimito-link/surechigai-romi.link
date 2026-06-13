/**
 * useRankingsData Hook
 * ランキング画面のデータ取得・状態管理
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import type { PeriodType, RankingTabType, RankingItem } from "../types";

interface UseRankingsDataReturn {
  // Data
  contributionRanking: RankingItem[] | undefined;
  hostRanking: RankingItem[] | undefined;
  myPosition: { position: number | null; totalContribution: number | null; participationCount?: number } | null | undefined;
  
  // State
  period: PeriodType;
  tab: RankingTabType;
  refreshing: boolean;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  hasData: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  
  // Current data
  data: RankingItem[] | undefined;
  
  // Actions
  setPeriod: (period: PeriodType) => void;
  setTab: (tab: RankingTabType) => void;
  onRefresh: () => Promise<void>;
}

export function useRankingsData(): UseRankingsDataReturn {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [tab, setTab] = useState<RankingTabType>("contribution");
  
  const { data: contributionRanking, isLoading: contributionLoading, isFetching: contributionFetching, refetch: refetchContribution } = 
    trpc.rankings.contribution.useQuery({ period, limit: 50 });
  const { data: hostRanking, isLoading: hostLoading, isFetching: hostFetching, refetch: refetchHost } = 
    trpc.rankings.hosts.useQuery({ limit: 50 });
  const { data: myPosition } = trpc.rankings.myPosition.useQuery(
    { period },
    { enabled: !!user }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === "contribution") {
      await refetchContribution();
    } else {
      await refetchHost();
    }
    setRefreshing(false);
  };

  // ローディング状態の分離
  const isLoading = tab === "contribution" ? contributionLoading : hostLoading;
  const isFetching = tab === "contribution" ? contributionFetching : hostFetching;
  const data = tab === "contribution" ? contributionRanking : hostRanking;
  const hasData = !!data && data.length > 0;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isFetching && hasData;

  return {
    contributionRanking,
    hostRanking,
    myPosition,
    period,
    tab,
    refreshing,
    isLoading,
    isFetching,
    hasData,
    isInitialLoading,
    isRefreshing,
    data,
    setPeriod,
    setTab,
    onRefresh,
  };
}
