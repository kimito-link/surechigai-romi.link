import { Text, View, ScrollView, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { navigate, navigateBack } from "@/lib/navigation";
import { useCallback, useState } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { UserProfileHeader } from "@/components/organisms/user-profile-header";
import { useProfileShare, useProfileFollow } from "@/features/profile/hooks";
import {
  ProfileTabBar,
  ProfileStatsRow,
  ProfileFollowCountRow,
  ParticipationHistoryList,
  BadgeGrid,
  ProfileShareSection,
} from "@/features/profile/components";
import type { ProfileTab } from "@/features/profile/components";
import type { PublicProfile } from "@/features/profile/types";

export default function ProfileScreen() {
  const colors = useColors();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("challenges");
  const parsedUserId = parseInt(userId || "0");
  const utils = trpc.useUtils();

  const { data: profileData, isLoading, isFetching, refetch } =
    trpc.profiles.get.useQuery({ userId: parsedUserId }, { enabled: !!userId });
  const profile = profileData as PublicProfile | null | undefined;
  const isOwnProfile = user?.id === parsedUserId;

  const {
    isFollowing,
    followerCount,
    followingCount,
    handleFollowToggle,
    refetchFollowStatus,
    isFollowPending,
  } = useProfileFollow({
    parsedUserId,
    userId,
    isOwnProfile,
    isLoggedIn: !!user,
    profile,
  });

  const { profileShareUrl, handleShareProfile } = useProfileShare({ profile });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    await refetchFollowStatus();
    setRefreshing(false);
  };

  const handleParticipationPress = useCallback(
    (challengeId: number) => {
      utils.events.getById.prefetch({ id: challengeId });
      navigate.toEventDetail(challengeId);
    },
    [utils]
  );

  if (isLoading && !profile) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color.accentPrimary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <Text style={styles.mutedText}>プロフィールが見つかりません</Text>
          <Pressable
            onPress={() => navigateBack()}
            style={styles.backFallback}
            accessibilityRole="button"
            accessibilityLabel="戻る"
          >
            <Text style={styles.backLink}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {isFetching && !!profile && <RefreshingIndicator isRefreshing />}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.hostAccentLegacy} />
        }
      >
        <AppHeader
          title="君斗りんくの動員ちゃれんじ"
          showCharacters={false}
          rightElement={
            <Pressable
              onPress={() => navigateBack()}
              style={styles.backRow}
              accessibilityRole="button"
              accessibilityLabel="戻る"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
              <Text style={[styles.backRowText, { color: colors.foreground }]}>戻る</Text>
            </Pressable>
          }
        />
        <UserProfileHeader
          user={{
            twitterId: profile.user?.twitterId ?? undefined,
            name: profile.user?.name ?? "名前未設定",
            username: profile.user?.username ?? undefined,
            profileImage: profile.user?.profileImage ?? undefined,
            followersCount: profile.user?.followersCount ?? 0,
            description: profile.user?.description ?? undefined,
            gender: profile.user?.gender as "male" | "female" | undefined,
          }}
          showFollowButton={!isOwnProfile && !!user}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          isFollowPending={isFollowPending}
        />
        <ProfileShareSection
          profileShareUrl={profileShareUrl}
          isOwnProfile={isOwnProfile}
          onShare={handleShareProfile}
        />
        <ProfileFollowCountRow
          followingCount={followingCount}
          followerCount={followerCount}
          onFollowingPress={() => navigate.toFollowing(userId)}
          onFollowersPress={() => navigate.toFollowers(userId)}
        />
        <ProfileStatsRow
          totalContribution={profile.stats?.totalContribution ?? 0}
          participationCount={profile.stats?.participationCount ?? 0}
          hostedCount={profile.stats?.hostedCount ?? 0}
        />
        <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <View style={styles.tabContent}>
          {activeTab === "challenges" ? (
            <ParticipationHistoryList
              participations={profile.participations ?? []}
              onPressItem={handleParticipationPress}
            />
          ) : (
            <BadgeGrid badges={profile.badges ?? []} />
          )}
        </View>
        {isOwnProfile && (
          <View style={styles.editArea}>
            <Pressable
              onPress={() => navigate.toProfileEdit()}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel="プロフィールを編集"
            >
              <Text style={[styles.editButtonText, { color: colors.foreground }]}>
                プロフィールを編集
              </Text>
            </Pressable>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: color.textMuted, marginTop: 12 },
  mutedText: { color: color.textMuted },
  backFallback: { marginTop: 16, padding: 12 },
  backLink: { color: color.hostAccentLegacy },
  backRow: { flexDirection: "row", alignItems: "center" },
  backRowText: { marginLeft: 8 },
  tabContent: { padding: 16 },
  editArea: { padding: 16 },
  editButton: { backgroundColor: color.border, borderRadius: 8, padding: 12, alignItems: "center" },
  editButtonText: { fontWeight: "600" },
  bottomSpacer: { height: 100 },
});
