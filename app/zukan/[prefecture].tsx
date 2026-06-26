import { View, Text, ScrollView, StyleSheet, RefreshControl, Image, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useResponsive } from "@/hooks/use-responsive";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";

export default function PrefectureEncounterScreen() {
  const { prefecture } = useLocalSearchParams<{ prefecture: string }>();
  const { isDesktop } = useResponsive();
  const router = useRouter();

  const prefName = typeof prefecture === "string" ? prefecture : prefecture?.[0] ?? "";

  const { data, isFetching, refetch } = trpc.zukan.encounterUsersByPrefecture.useQuery(
    { prefecture: prefName },
    { enabled: !!prefName }
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title={`${prefName} で参加しているクリエイター`}
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={false}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={color.accentAlt} />}
        contentContainerStyle={styles.scrollContent}
      >
        {data?.users && data.users.length > 0 ? (
          <View style={styles.list}>
            {data.users.map((u) => (
              <View key={u.partnerId} style={styles.userCard}>
                <Image
                  source={{
                    uri: u.partnerProfileImage || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {u.partnerDisplayName || "名無し"}
                  </Text>
                  {u.partnerUsername && (
                    <Text style={styles.username} numberOfLines={1}>
                      @{u.partnerUsername}
                    </Text>
                  )}
                  <View style={styles.statsRow}>
                    <Text style={styles.statText}>すれ違い: {u.encounterCount}回</Text>
                    <Text style={styles.statText}>
                      最終: {new Date(u.lastEncounteredAt).toLocaleDateString("ja-JP")}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            {isFetching ? (
              <Text style={styles.emptyText}>読み込み中...</Text>
            ) : (
              <>
                <MaterialIcons name="person-off" size={48} color={color.textMuted} />
                <Text style={styles.emptyText}>まだこの県ですれ違った人はいません</Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.surfaceAlt,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  username: {
    fontSize: 13,
    color: color.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  statText: {
    fontSize: 12,
    color: color.textSecondary,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
