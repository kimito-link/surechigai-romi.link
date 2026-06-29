/**
 * 都道府県別クリエイター一覧
 * /zukan/[prefecture] — 県をタップすると「参加しているクリエイター」一覧へ。
 */
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { formatRelativeJa } from "@/lib/date-utils";
import { palette } from "@/theme/tokens";

const DEFAULT_AVATAR =
  "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

function Breadcrumb({
  prefName,
  onHome,
  onZukan,
}: {
  prefName: string;
  onHome: () => void;
  onZukan: () => void;
}) {
  return (
    <View style={styles.breadcrumb}>
      <Pressable onPress={onHome} accessibilityRole="link">
        <Text style={styles.breadcrumbLink}>ホーム</Text>
      </Pressable>
      <Text style={styles.breadcrumbSep}> › </Text>
      <Pressable onPress={onZukan} accessibilityRole="link">
        <Text style={styles.breadcrumbLink}>都道府県別</Text>
      </Pressable>
      <Text style={styles.breadcrumbSep}> › </Text>
      <Text style={styles.breadcrumbCurrent}>{prefName}</Text>
    </View>
  );
}

export default function PrefectureCreatorsScreen() {
  const { prefecture } = useLocalSearchParams<{ prefecture: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const prefName = typeof prefecture === "string" ? prefecture : prefecture?.[0] ?? "";

  const { data, isFetching, refetch, isLoading } = trpc.zukan.creatorsByPrefecture.useQuery(
    { prefecture: prefName },
    { enabled: !!prefName },
  );

  const creators = data?.creators ?? [];
  const count = creators.length;

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const goHome = useCallback(() => {
    router.push("/(tabs)");
  }, [router]);

  const goZukan = useCallback(() => {
    router.push("/(tabs)/zukan");
  }, [router]);

  const openCreator = useCallback(
    (username: string | null, shareSlug: string | null) => {
      if (shareSlug) {
        router.push(`/u/${shareSlug}` as Href);
        return;
      }
      if (username) {
        void Linking.openURL(`https://x.com/${username.replace(/^@/, "")}`);
      }
    },
    [router],
  );

  if (!prefName) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.errorText}>都道府県が指定されていません</Text>
          <Pressable onPress={goZukan} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>都道府県別一覧に戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {!isAuthenticated ? (
        <LoginPreviewBanner headline="ログインすると、あなたの記録もこの一覧に載ります" />
      ) : null}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={palette.kimitoBlue} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.page}>
          <Breadcrumb prefName={prefName} onHome={goHome} onZukan={goZukan} />

          <Text style={styles.pageTitle} accessibilityRole="header">
            {prefName} で参加しているクリエイター
          </Text>

          <Text style={styles.pageDescription}>
            君斗りんくのすれ違ひ通信の一覧です。
            {prefName}で最後に記録した人も含みます。滞在が短い人も表示されます。
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>登録 {count} 人</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={palette.kimitoBlue} />
              <Text style={styles.loadingText}>読み込み中…</Text>
            </View>
          ) : count > 0 ? (
            <View style={styles.list}>
              {creators.map((c) => (
                <Pressable
                  key={c.userId}
                  style={({ pressed }) => [styles.creatorCard, pressed && styles.creatorCardPressed]}
                  onPress={() => openCreator(c.username, c.shareSlug)}
                  accessibilityRole="button"
                >
                  <Image
                    source={{ uri: c.profileImage || DEFAULT_AVATAR }}
                    style={styles.avatar}
                  />
                  <View style={styles.creatorInfo}>
                    <Text style={styles.creatorName} numberOfLines={2}>
                      {c.displayName || c.username || "名無し"}
                    </Text>
                    <Text style={styles.creatorMeta}>
                      この県に最後に滞在: {formatRelativeJa(c.lastStayedAt)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="person-off" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                まだ{prefName}に記録があるクリエイターはいません
              </Text>
            </View>
          )}

          <View style={styles.footerActions}>
            <Pressable
              onPress={goZukan}
              style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <MaterialIcons name="arrow-back" size={18} color="#374151" />
              <Text style={styles.outlineBtnText}>都道府県別一覧に戻る</Text>
            </Pressable>

            <Pressable
              onPress={goHome}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>ダッシュボードへ</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#FAFAFA",
    paddingBottom: 48,
  },
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  breadcrumb: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: palette.kimitoBlue,
    fontWeight: "600",
  },
  breadcrumbSep: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 16,
  },
  pageDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  countBadge: {
    alignSelf: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  list: {
    gap: 12,
    marginBottom: 32,
  },
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  creatorCardPressed: {
    opacity: 0.92,
    backgroundColor: "#F9FAFB",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E5E7EB",
  },
  creatorInfo: {
    flex: 1,
    minWidth: 0,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
  },
  creatorMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  primaryBtn: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: palette.kimitoOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  btnPressed: {
    opacity: 0.9,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: "#6B7280",
  },
});
