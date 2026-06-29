/**
 * 軌跡マップ画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * Web: 保存済みの正確な lat/lng/accuracyM を OpenStreetMap タイル上に表示する。
 * Native: 地図SDK導入まではプレースホルダ表示。
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  Image,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { useCallback, useMemo, type ReactNode } from "react";
import Svg, { Polyline } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import {
  PrecisionTileMap,
  formatPlace,
  formatDateTime,
  formatCoordinate,
  TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { useRouter } from "expo-router";

/** Native プレースホルダ */
function NativePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <MaterialIcons name="map" size={64} color={color.textMuted} />
      <Text style={styles.placeholderTitle}>軌跡マップ</Text>
      <Text style={styles.placeholderSubtitle}>
        アプリ版で近日対応予定です{"\n"}Web ブラウザからお楽しみください
      </Text>
    </View>
  );
}

/** Web用軌跡マップ */
function WebTrailMap({
  visited,
  locations,
  isFetching,
  onRefresh,
  userImageUrl,
  topContent,
  contentPaddingBottom,
}: {
  visited: {
    prefecture: string | null;
    visitCount: number;
    lastVisitedAt: Date | string;
  }[];
  locations: TrailPoint[];
  isFetching: boolean;
  onRefresh: () => void;
  userImageUrl?: string;
  topContent?: ReactNode;
  contentPaddingBottom?: number;
}) {
  const total = visited.reduce((s, v) => s + v.visitCount, 0);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={onRefresh}
          tintColor={color.accentIndigo}
        />
      }
      contentContainerStyle={[styles.scrollContent, contentPaddingBottom ? { paddingBottom: contentPaddingBottom } : null]}
    >
      {topContent}
      {locations.length > 0 ? (
        <PrecisionTileMap locations={locations} userImageUrl={userImageUrl} />
      ) : (
        <View style={styles.emptyMap}>
          <MaterialIcons name="near-me-disabled" size={48} color={color.textMuted} />
          <Text style={styles.emptyTitle}>まだ正確な足あとがありません</Text>
          <Text style={styles.emptyText}>
            チェックインすると、道路や建物の位置まで辿れる精度で記録されます
          </Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>
            {visited.length}
          </Text>
          <Text style={styles.summaryLabel}>訪問都道府県</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentAlt }]}>
            {total}
          </Text>
          <Text style={styles.summaryLabel}>総チェックイン</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.success }]}>
            {locations.length}
          </Text>
          <Text style={styles.summaryLabel}>表示中の足あと</Text>
        </View>
      </View>

      {locations.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>最近の正確な記録</Text>
          {locations.slice(0, 12).map((point, index) => (
            <View key={point.id} style={styles.trailRow}>
              <View style={[styles.trailDot, index === 0 && styles.trailDotLatest]} />
              <View style={styles.trailInfo}>
                <Text style={styles.trailPref} numberOfLines={1}>
                  {formatPlace(point)}
                </Text>
                <Text style={styles.trailDate} numberOfLines={1}>
                  {formatDateTime(point.recordedAt)} / {formatCoordinate(point)}
                </Text>
              </View>
              <View style={styles.trailCountBadge}>
                <Text style={styles.trailCountText}>
                  {point.accuracyM ? `±${Math.round(point.accuracyM)}m` : "精度不明"}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

export default function MapScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const router = useRouter();
  const tabInset = useTabBarInset();

  const {
    data: areasData,
    refetch: refetchAreas,
    isFetching: isFetchingAreas,
  } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const {
    data: trailData,
    refetch: refetchTrail,
    isFetching: isFetchingTrail,
  } = trpc.zukan.myTrail.useQuery({ limit: 120 }, {
    enabled: isAuthenticated,
  });

  const onRefresh = useCallback(() => {
    void Promise.all([refetchAreas(), refetchTrail()]);
  }, [refetchAreas, refetchTrail]);

  const visited = areasData?.visited ?? [];
  const locations = trailData?.locations ?? [];

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader 
          title="軌跡" 
          showCharacters={false} 
          isDesktop={isDesktop} 
          showMenu 
          leftElement={
            <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
              <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="軌跡"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          leftElement={
            <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
              <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
        />

      {Platform.OS !== "web" ? (
        <NativePlaceholder />
      ) : (
        <WebTrailMap
          visited={visited}
          locations={locations}
          isFetching={isFetchingAreas || isFetchingTrail}
          onRefresh={onRefresh}
          userImageUrl={user?.profileImage ?? undefined}
          contentPaddingBottom={tabInset}
          topContent={
            !isAuthenticated ? (
              <View style={styles.bannerWrap}>
                <LoginPreviewBanner
                  headline="ログインすると、あなたの足あとが地図に刻まれます"
                  benefits={[
                    { icon: "near-me", label: "道路や建物まで辿れる精度で記録" },
                    { icon: "timeline", label: "移動の軌跡をあとから振り返れる" },
                    { icon: "place", label: "思い出の場所にもう一度行ける" },
                  ]}
                />
              </View>
            ) : undefined
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholderSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  bannerWrap: {
    width: "100%",
    maxWidth: 980,
  },
  mapAttribution: {
    position: "absolute",
    left: 8,
    bottom: 6,
    color: color.textWhite,
    fontSize: 10,
    backgroundColor: color.bg + "99",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  emptyMap: {
    width: "100%",
    maxWidth: 980,
    minHeight: 320,
    backgroundColor: color.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    marginBottom: 16,
  },
  emptyTitle: {
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  summaryRow: {
    width: "100%",
    maxWidth: 980,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: color.border,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: color.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
  sectionTitle: {
    width: "100%",
    maxWidth: 980,
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  trailRow: {
    width: "100%",
    maxWidth: 980,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: color.surface,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: color.border,
  },
  trailDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: color.accentAlt,
    marginRight: 12,
  },
  trailDotLatest: {
    backgroundColor: color.accentIndigo,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trailInfo: {
    flex: 1,
    minWidth: 0,
  },
  trailPref: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  trailDate: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  trailCountBadge: {
    backgroundColor: color.accentIndigo + "22",
    borderWidth: 1,
    borderColor: color.accentIndigo + "44",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  trailCountText: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "800",
  },
});
