/**
 * useEventDetail Hook
 * イベント詳細画面のデータ取得・状態管理
 */

import { useMemo, useState, useCallback } from "react";
import { Alert } from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { goalTypeConfig } from "@/constants/goal-types";
import { MOMENTUM_THRESHOLDS, UNDECIDED_DATE_YEAR, formatEventDate } from "../constants";
import type { MomentumData, PrefectureCounts, EventDetailData } from "../types";
import type { Participation } from "@/types/participation";

interface UseEventDetailOptions {
  challengeId: number;
}

interface UseEventDetailReturn {
  // Data
  challenge: EventDetailData | undefined;
  participations: Participation[] | undefined;
  challengeCompanions: Array<{
    id: number;
    participationId: number;
    displayName: string;
    twitterUsername: string | null;
    profileImage: string | null;
  }> | undefined;
  followerIds: number[] | undefined;
  myParticipation: Participation | null;
  momentum: MomentumData;
  prefectureCounts: PrefectureCounts;
  attendanceTypeCounts: { venue: number; streaming: number; both: number; total: number } | undefined;
  
  // Computed values
  eventDate: Date | null;
  isDateUndecided: boolean;
  formattedDate: string;
  unit: string;
  currentValue: number;
  goalValue: number;
  progress: number;
  remaining: number;
  currentUserTwitterId: string | undefined;
  
  // Loading states
  hasData: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  /** @deprecated Use isInitialLoading instead */
  isLoading: boolean;
  /** @deprecated Use isInitialLoading instead */
  challengeLoading: boolean;
  participationsLoading: boolean;
  
  // User & Auth
  user: ReturnType<typeof useAuth>["user"];
  login: ReturnType<typeof useAuth>["login"];
  
  // Favorites
  isChallengeFavorite: boolean;
  toggleFavorite: (id: number) => void;
  
  // Follow
  isFollowing: boolean | undefined;
  hostUserId: number | undefined;
  handleFollowToggle: () => void;
  
  // Actions
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useEventDetail({ challengeId }: UseEventDetailOptions): UseEventDetailReturn {
  const { user, login } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data queries
  const { 
    data: challenge, 
    isLoading: challengeLoading,
    isFetching: challengeFetching
  } = trpc.events.getById.useQuery({ id: challengeId });
  
  const { 
    data: participations, 
    isLoading: participationsLoading,
    isFetching: participationsFetching,
    refetch: refetchParticipations 
  } = trpc.participations.listByEvent.useQuery({ eventId: challengeId });
  
  // 参加方法別集計
  const { data: attendanceTypeCounts } = (trpc.participations as any).getAttendanceTypeCounts.useQuery({ eventId: challengeId });
  
  const { data: challengeCompanions } = trpc.companions.forChallenge.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );
  
  // Host user ID
  const hostUserId = challenge?.hostUserId ?? undefined;
  
  // Follow state
  const { data: isFollowing } = trpc.follows.isFollowing.useQuery(
    { followeeId: hostUserId! },
    { enabled: !!user && !!hostUserId && hostUserId !== user.id }
  );
  
  const { data: followerIds } = (trpc.follows as any).followerIds.useQuery(
    { userId: hostUserId! },
    { enabled: !!hostUserId }
  );
  
  // Follow mutations
  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      Alert.alert("フォローしました", "新着チャレンジの通知を受け取れます");
    },
  });
  
  const unfollowMutation = trpc.follows.unfollow.useMutation();
  
  // Handle follow toggle
  const handleFollowToggle = () => {
    if (!user) {
      Alert.alert("ログインが必要です", "フォローするにはログインしてください");
      return;
    }
    if (!hostUserId) return;
    
    if (isFollowing) {
      unfollowMutation.mutate({ followeeId: hostUserId });
    } else {
      followMutation.mutate({
        followeeId: hostUserId,
        followeeName: challenge?.hostName,
        followeeImage: challenge?.hostProfileImage || undefined,
      });
    }
  };
  
  // My participation
  const myParticipation = useMemo(() => {
    if (!user || !participations) return null;
    const twitterId = user.openId?.startsWith("twitter:") 
      ? user.openId.replace("twitter:", "") 
      : user.openId;
    return participations.find(p => p.twitterId === twitterId) || null;
  }, [user, participations]);
  
  // Momentum calculation
  const momentum = useMemo((): MomentumData => {
    if (!participations) return { recent24h: 0, recent1h: 0, isHot: false };
    const now = new Date();
    const recent24h = participations.filter(p => {
      const createdAt = new Date(p.createdAt);
      return (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
    }).length;
    const recent1h = participations.filter(p => {
      const createdAt = new Date(p.createdAt);
      return (now.getTime() - createdAt.getTime()) < 60 * 60 * 1000;
    }).length;
    return {
      recent24h,
      recent1h,
      isHot: recent24h >= MOMENTUM_THRESHOLDS.HOT_24H || recent1h >= MOMENTUM_THRESHOLDS.HOT_1H,
    };
  }, [participations]);
  
  // Prefecture counts
  const prefectureCounts = useMemo((): PrefectureCounts => {
    const counts: PrefectureCounts = {};
    if (participations) {
      participations.forEach(p => {
        if (p.prefecture) {
          counts[p.prefecture] = (counts[p.prefecture] || 0) + (p.contribution || 1);
        }
      });
    }
    return counts;
  }, [participations]);
  
  // Computed values
  const eventDate = challenge ? new Date(challenge.eventDate) : null;
  const isDateUndecided = eventDate?.getFullYear() === UNDECIDED_DATE_YEAR;
  const formattedDate = eventDate ? formatEventDate(eventDate) : "";
  
  const goalConfig = goalTypeConfig[challenge?.goalType || "attendance"] || goalTypeConfig.attendance;
  const unit = challenge?.goalUnit || goalConfig.unit;
  const currentValue = challenge?.currentValue || 0;
  const goalValue = challenge?.goalValue || 100;
  const progress = Math.min((currentValue / goalValue) * 100, 100);
  const remaining = Math.max(goalValue - currentValue, 0);
  
  // Current user Twitter ID
  const currentUserTwitterId = user?.openId?.startsWith("twitter:") 
    ? user.openId.replace("twitter:", "") 
    : user?.openId;
  
  // Favorite state
  const isChallengeFavorite = isFavorite(challengeId);
  
  // Refetch wrapper
  const refetch = async () => {
    await refetchParticipations();
  };
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchParticipations();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchParticipations]);
  
  return {
    // Data
    challenge: challenge as EventDetailData | undefined,
    participations: participations as Participation[] | undefined,
    challengeCompanions,
    followerIds,
    myParticipation,
    momentum,
    prefectureCounts,
    attendanceTypeCounts,
    
    // Computed values
    eventDate,
    isDateUndecided,
    formattedDate,
    unit,
    currentValue,
    goalValue,
    progress,
    remaining,
    currentUserTwitterId,
    
    // Loading states
    hasData: !!challenge,
    isInitialLoading: (challengeLoading || participationsLoading) && !challenge,
    isRefreshing: (challengeFetching || participationsFetching) && !!challenge,
    // Deprecated
    isLoading: (challengeLoading || participationsLoading) && !challenge,
    challengeLoading,
    participationsLoading,
    
    // User & Auth
    user,
    login,
    
    // Favorites
    isChallengeFavorite,
    toggleFavorite,
    
    // Follow
    isFollowing,
    hostUserId,
    handleFollowToggle,
    
    // Actions
    refetch,
    onRefresh,
  };
}
