/**
 * 公開共有リンク /u/<slug>
 * X 等でシェアされた URL を開くと、その人の最後の記録地点を地図で表示する。
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import {
  PrecisionTileMap,
  formatDateTime,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";

function displayName(name: string | null, username: string | null): string {
  if (name) return name;
  if (username) return `@${username}`;
  return "この人";
}

export default function ShareLocationScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === "string" ? slugParam : slugParam?.[0] ?? "";
  const { isDesktop } = useResponsive();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const shareQuery = trpc.ogp.getShareBySlug.useQuery(
    { slug },
    { enabled: /^[A-Za-z0-9]{1,16}$/.test(slug), retry: false },
  );

  const mapW = Math.max(320, Math.min(windowWidth - 32, 980));
  const mapH = windowWidth < 640 ? 360 : 440;

  const mapPoint = useMemo<TrailPoint | null>(() => {
    const info = shareQuery.data;
    if (!info?.hasLocation || info.lat == null || info.lng == null) return null;
    return {
      id: 0,
      lat: info.lat,
      lng: info.lng,
      accuracyM: null,
      municipality: info.area,
      prefecture: info.prefecture,
      address: null,
      recordedAt: info.recordedAt ?? new Date().toISOString(),
    };
  }, [shareQuery.data]);

  const placeLabel =
    shareQuery.data?.area ??
    shareQuery.data?.prefecture ??
    "どこか";

  const who = shareQuery.data
    ? displayName(shareQuery.data.name, shareQuery.data.username)
    : "";

  const xUrl = shareQuery.data?.username
    ? `https://x.com/${shareQuery.data.username.replace(/^@/, "")}`
    : null;

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        showTagline={false}
        isDesktop={isDesktop}
        showLoginButton={!isAuthenticated}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {shareQuery.isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={color.accentPrimary} />
            <Text style={styles.loadingText}>現在地を読み込み中…</Text>
          </View>
        )}

        {shareQuery.isError && (
          <View style={styles.center}>
            <MaterialIcons name="link-off" size={48} color={color.textMuted} />
            <Text style={styles.errorTitle}>共有リンクが見つかりません</Text>
            <Text style={styles.errorText}>
              リンクの有効期限が切れたか、公開が停止されている可能性があります。
            </Text>
            <Pressable
              onPress={() => router.replace("/(tabs)")}
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryButtonText}>トップへ</Text>
            </Pressable>
          </View>
        )}

        {shareQuery.data && (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.kicker}>会いたい君がいる現在地</Text>
              <Text style={styles.whoLine}>{who}</Text>
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>{placeLabel} にいるよ</Text>
              </View>
              {shareQuery.data.recordedAt && (
                <Text style={styles.recordedAt}>
                  記録: {formatDateTime(shareQuery.data.recordedAt)}
                  {shareQuery.data.precise ? " · 詳細位置" : " · おおよその位置"}
                </Text>
              )}
            </View>

            {mapPoint ? (
              <View style={styles.mapWrap}>
                <PrecisionTileMap
                  locations={[mapPoint]}
                  width={mapW}
                  height={mapH}
                  zoom={shareQuery.data.zoom}
                  customCenter={{ lat: mapPoint.lat, lng: mapPoint.lng }}
                  showInfoPanel={false}
                  markerSize={36}
                  markerIcon="place"
                />
              </View>
            ) : (
              <View style={styles.noMap}>
                <MaterialIcons name="location-off" size={40} color={color.textMuted} />
                <Text style={styles.noMapText}>
                  {placeLabel !== "どこか"
                    ? `${placeLabel} 付近（地図ピン非公開）`
                    : "地点は非公開です"}
                </Text>
              </View>
            )}

            {xUrl && (
              <Pressable
                onPress={() => Linking.openURL(xUrl).catch(() => {})}
                style={({ pressed }) => [styles.xLinkRow, pressed && { opacity: 0.75 }]}
              >
                <MaterialIcons name="open-in-new" size={16} color={palette.kimitoBlue} />
                <Text style={styles.xLinkText}>X で @{shareQuery.data.username?.replace(/^@/, "")} を見る</Text>
              </Pressable>
            )}

            {!isAuthenticated && (
              <LoginPreviewBanner
                headline="あなたも今いる場所を記録して、すれ違いをはじめよう"
                benefits={[
                  { icon: "place", label: "足あとを正確に残して、あとでその場所に行ける" },
                  { icon: "groups", label: "同じ場所を通った人とすれ違える" },
                  { icon: "ios-share", label: "現在地をXでシェアできる" },
                ]}
              />
            )}

            <Pressable
              onPress={() => router.push("/(tabs)/checkin")}
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="location-on" size={18} color={palette.kimitoBlue} />
              <Text style={styles.secondaryButtonText}>チェックイン画面へ</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "web" ? 48 : 32,
    gap: 16,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
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
  heroCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    padding: 18,
    gap: 8,
    alignItems: "center",
  },
  kicker: {
    color: palette.kimitoOrange,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  whoLine: {
    color: palette.kimitoBlue,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  speechBubble: {
    marginTop: 4,
    backgroundColor: palette.kimitoBlueSoft,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#00427B22",
  },
  speechText: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  recordedAt: {
    color: palette.kimitoInkMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  mapWrap: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: color.border,
    alignSelf: "center",
  },
  noMap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
    padding: 24,
  },
  noMapText: {
    color: color.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  xLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  xLinkText: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "700",
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "44",
    backgroundColor: palette.kimitoBlueSoft,
  },
  secondaryButtonText: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "800",
  },
});
