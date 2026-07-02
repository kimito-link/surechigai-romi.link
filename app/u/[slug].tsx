/**
 * 公開共有リンク /u/<slug>
 * 都道府県クリエイター一覧からタップすると、この人の軌跡（地図 + 最近の記録）を表示する。
 */
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { PublicShareHeader } from "@/components/organisms/public-share-header";
import { LazyWebTrailMap } from "@/lib/lazy-heavy-components";
import { CreatorAvatar } from "@/components/molecules/creator-avatar";
import { InlineLoginPrompt } from "@/components/molecules/inline-login-prompt";
import { trpc } from "@/lib/trpc";
import { hasClerkSessionInStorage } from "@/lib/has-clerk-session";
import { Platform } from "react-native";
import { color, palette, contentMaxWidth } from "@/theme/tokens";

function displayWho(name: string | null, username: string | null): string {
  if (name) return name;
  if (username) return `@${username.replace(/^@/, "")}`;
  return "この人";
}

export default function ShareLocationScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === "string" ? slugParam : slugParam?.[0] ?? "";
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      setIsAuthenticated(hasClerkSessionInStorage());
    }
  }, []);

  const trailQuery = trpc.ogp.getTrailBySlug.useQuery(
    { slug, limit: 120 },
    { enabled: /^[A-Za-z0-9]{1,16}$/.test(slug), retry: false },
  );

  const who = trailQuery.data
    ? displayWho(trailQuery.data.name, trailQuery.data.username)
    : "";
  const fallbackInitial = (trailQuery.data?.name || trailQuery.data?.username || "?").slice(0, 1);

  return (
    <ScreenContainer
      containerClassName="bg-background"
      showFooter={false}
      headerSlot={
        <PublicShareHeader
          title="軌跡"
          showLoginButton={!isAuthenticated}
          returnTo={`/u/${slug}`}
          leftElement={
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <MaterialIcons name="arrow-back" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
        />
      }
    >
      {trailQuery.isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color.accentPrimary} />
          <Text style={styles.loadingText}>軌跡を読み込み中…</Text>
        </View>
      )}

      {trailQuery.isError && (
        <View style={styles.center}>
          <MaterialIcons name="link-off" size={48} color={color.textMuted} />
          <Text style={styles.errorTitle}>共有リンクが見つかりません</Text>
          <Text style={styles.errorText}>
            リンクの有効期限が切れたか、公開が停止されている可能性があります。
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)/zukan")}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryButtonText}>都道府県別一覧へ</Text>
          </Pressable>
        </View>
      )}

      {trailQuery.data && (
        <LazyWebTrailMap
          visited={trailQuery.data.visited}
          locations={trailQuery.data.locations}
          userImageUrl={trailQuery.data.profileImage ?? undefined}
          onRefresh={() => void trailQuery.refetch()}
          isFetching={trailQuery.isFetching}
          emptyTitle={
            trailQuery.data.paused
              ? "位置情報の公開を一時停止中です"
              : "まだ正確な足あとがありません"
          }
          emptyText={
            trailQuery.data.paused
              ? "この人は現在、軌跡の公開を止めています。"
              : "チェックイン記録があると、ここに地図と足あとが表示されます。"
          }
          showSavedLocationHint
          topContent={
            <>
              <View style={styles.profileHeader}>
                <CreatorAvatar
                  src={trailQuery.data.profileImage}
                  alt={who}
                  fallbackInitial={fallbackInitial}
                  size={48}
                />
                <View style={styles.profileText}>
                  <Text style={styles.kicker}>会いたい君がいる現在地</Text>
                  <Text style={styles.whoLine} numberOfLines={2}>
                    {who}
                  </Text>
                  {trailQuery.data.username ? (
                    <Text style={styles.handle}>
                      @{trailQuery.data.username.replace(/^@/, "")}
                    </Text>
                  ) : null}
                </View>
              </View>
              {!isAuthenticated ? (
                <View style={styles.bannerWrap}>
                  <InlineLoginPrompt headline="あなたの足あとも、地図に刻めます" />
                </View>
              ) : null}
            </>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: color.textMuted,
    fontSize: 14,
  },
  errorTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "800",
  },
  profileHeader: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  profileText: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  kicker: {
    color: palette.kimitoOrange,
    fontSize: 11,
    fontWeight: "800",
  },
  whoLine: {
    color: palette.kimitoBlue,
    fontSize: 18,
    fontWeight: "800",
  },
  handle: {
    color: "#1D9BF0",
    fontSize: 13,
    fontWeight: "700",
  },
  bannerWrap: {
    width: "100%",
  },
});
