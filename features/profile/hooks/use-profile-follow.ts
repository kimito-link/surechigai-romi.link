/**
 * features/profile/hooks/use-profile-follow.ts
 * フォロー / フォロー解除ロジック
 */

import { useCallback } from "react";
import { Alert } from "react-native";
import { trpc } from "@/lib/trpc";
import { commonCopy } from "@/constants/copy/common";
import type { PublicProfile } from "../types";

interface UseProfileFollowParams {
  parsedUserId: number;
  userId: string | undefined;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  profile: PublicProfile | null | undefined;
}

export function useProfileFollow({
  parsedUserId,
  userId,
  isOwnProfile,
  isLoggedIn,
  profile,
}: UseProfileFollowParams) {
  const { data: isFollowing, refetch: refetchFollowStatus } =
    trpc.follows.isFollowing.useQuery(
      { followeeId: parsedUserId },
      { enabled: isLoggedIn && !isOwnProfile && parsedUserId > 0 }
    );
  const { data: followerCount } = trpc.follows.followerCount.useQuery(
    { userId: parsedUserId },
    { enabled: parsedUserId > 0 }
  );
  const { data: followingCount } = trpc.follows.followingCount.useQuery(
    { userId: parsedUserId },
    { enabled: parsedUserId > 0 }
  );

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      refetchFollowStatus();
      Alert.alert(commonCopy.alerts.followDone, "新着チャレンジの通知を受け取れます");
    },
    onError: (e) => Alert.alert(commonCopy.alerts.error, e.message),
  });
  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => refetchFollowStatus(),
    onError: (e) => Alert.alert(commonCopy.alerts.error, e.message),
  });

  const handleFollowToggle = useCallback(() => {
    if (!isLoggedIn) {
      Alert.alert(commonCopy.alerts.loginRequired, "フォローするにはログインしてください");
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate({ followeeId: parsedUserId });
    } else {
      followMutation.mutate({
        followeeId: parsedUserId,
        followeeName: profile?.user?.name,
        followeeImage: profile?.user?.profileImage ?? undefined,
      });
    }
  }, [isLoggedIn, isFollowing, parsedUserId, unfollowMutation, followMutation, profile]);

  return {
    isFollowing,
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
    handleFollowToggle,
    refetchFollowStatus,
    isFollowPending: followMutation.isPending || unfollowMutation.isPending,
  };
}
