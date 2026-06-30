/**
 * 図鑑画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * - 47都道府県グリッド（訪問済み/すれ違い済みで色分け）
 * - 市区町村リスト
 * - zukan.myAreas を使用
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useCallback, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { JapanBlockMap } from "@/components/organisms/japan-block-map";
import {
  PrecisionTileMap,
  fitCenterZoom,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { useRouter } from "expo-router";
import { AUTHENTICATED_QUERY_OPTIONS } from "@/lib/authenticated-query-options";

export default function ZukanScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReady } = useAuth();
  const router = useRouter();
  const tabInset = useTabBarInset();
  const { width: windowWidth } = useWindowDimensions();

  const { data, refetch, isFetching } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
    ...AUTHENTICATED_QUERY_OPTIONS,
  });

  // 全国の足あと（地図用）
  const { data: trailData, refetch: refetchTrail } = trpc.zukan.myTrail.useQuery(
    { limit: 500 },
    {
      enabled: isAuthenticated,
      ...AUTHENTICATED_QUERY_OPTIONS,
    },
  );
  const trailLocations: TrailPoint[] = trailData?.locations ?? [];

  const mapW = Math.max(320, Math.min(windowWidth - 32, 980));
  const mapH = windowWidth < 640 ? 340 : 460;
  const { center: trailCenter, zoom: trailZoom } = useMemo(
    () => fitCenterZoom(trailLocations, mapW, mapH),
    [trailLocations, mapW, mapH]
  );

  const onRefresh = useCallback(() => {
    refetch();
    refetchTrail();
  }, [refetch, refetchTrail]);

  // 訪問・すれ違いのセットを構築
  const visitedPrefSet = new Set<string>(
    (data?.visited ?? [])
      .map((v) => v.prefecture)
      .filter((p): p is string => !!p),
  );
  const encounteredPrefSet = new Set<string>(
    (data?.encounterPrefectures ?? [])
      .map((e) => e.prefecture)
      .filter((p): p is string => !!p),
  );

  const visitedCount = visitedPrefSet.size;
  const encounteredCount = new Set([...visitedPrefSet, ...encounteredPrefSet]).size;

  const encounterCountMap = (data?.encounterPrefectures ?? []).reduce(
    (acc, e) => {
      if (e.prefecture) acc[e.prefecture] = e.encounterCount;
      return acc;
    },
    {} as Record<string, number>
  );

  // visitedAreas は h3R7 セル単位なので、市区町村ごとに集計し直して一覧にする
  const municipalitySummary = useMemo(() => {
    const map = new Map<
      string,
      { municipality: string; prefecture: string | null; visitCount: number; lastVisitedAt: Date | string }
    >();
    for (const v of data?.visited ?? []) {
      const name = v.municipality || v.prefecture;
      if (!name) continue;
      const key = `${v.prefecture ?? ""}/${name}`;
      const prev = map.get(key);
      if (prev) {
        prev.visitCount += v.visitCount;
        if (new Date(v.lastVisitedAt) > new Date(prev.lastVisitedAt)) {
          prev.lastVisitedAt = v.lastVisitedAt;
        }
      } else {
        map.set(key, {
          municipality: name,
          prefecture: v.prefecture,
          visitCount: v.visitCount,
          lastVisitedAt: v.lastVisitedAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.visitCount - a.visitCount);
  }, [data]);

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader 
          title="図鑑" 
          showCharacters={false} 
          isDesktop={isDesktop} 
          showMenu={true} 
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
        title="図鑑"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        leftElement={
          <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
            <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={color.accentAlt}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabInset }]}
      >
        {/* 未ログインでも図鑑（日本地図）の中身は見せて、ログインで解放する */}
        {!isAuthenticated && (
          <LoginPreviewBanner
            headline="ログインすると、あなただけの図鑑が育ちます"
            benefits={[
              { icon: "map", label: "訪れた都道府県・市区町村が色づく" },
              { icon: "groups", label: "すれ違った人の出身地が集まる" },
              { icon: "place", label: "足あとの正確な場所をあとからたどれる" },
            ]}
          />
        )}

        {/* 統計サマリ */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>{visitedCount}</Text>
            <Text style={styles.summaryLabel}>訪問した都道府県</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: color.accentAlt }]}>{encounteredCount}</Text>
            <Text style={styles.summaryLabel}>すれ違い都道府県</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: color.accentPrimary }]}>
              {data?.encounterPrefectures?.reduce((s, e) => s + e.encounterCount, 0) ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>総すれ違い数</Text>
          </View>
        </View>

        {/* 凡例 */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color.accentIndigo }]} />
            <Text style={styles.legendText}>訪問済み</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color.accentAlt }]} />
            <Text style={styles.legendText}>すれ違い相手</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color.border }]} />
            <Text style={styles.legendText}>未訪問</Text>
          </View>
        </View>

        {/* 全国の足あと地図（正確な座標。タップで県別へ） */}
        {trailLocations.length > 0 && (
          <View style={styles.trailMapSection}>
            <Text style={styles.sectionTitle}>あなたの足あと（全国）</Text>
            <PrecisionTileMap
              locations={trailLocations}
              width={mapW}
              height={mapH}
              customCenter={trailCenter}
              zoom={trailZoom}
              showInfoPanel={false}
            />
            <Text style={styles.trailMapCaption}>
              {trailLocations.length} 件の正確な足あと・思い出の場所をあとからたどれます
            </Text>
          </View>
        )}

        {/* 都道府県グリッド */}
        <Text style={styles.sectionTitle}>みんながいる現在地（都道府県別）</Text>
        <JapanBlockMap
          visitedPrefSet={visitedPrefSet}
          encounteredPrefSet={encounteredPrefSet}
          encounterCountMap={encounterCountMap}
          onPressPrefecture={(pref) => {
            router.push({ pathname: "/zukan/[prefecture]", params: { prefecture: pref } } as any);
          }}
        />

        {/* 市区町村リスト（市区町村ごとに集計） */}
        {municipalitySummary.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>訪問した市区町村</Text>
            <View style={styles.municipalityList}>
              {municipalitySummary.map((m, i) => (
                <View key={i} style={styles.municipalityRow}>
                  <View style={styles.municipalityInfo}>
                    <Text style={styles.municipalityPrefecture}>{m.municipality}</Text>
                    <Text style={styles.municipalityVisitCount}>
                      {m.prefecture && m.prefecture !== m.municipality
                        ? `${m.prefecture}・${m.visitCount} 回訪問`
                        : `${m.visitCount} 回訪問`}
                    </Text>
                  </View>
                  <Text style={styles.municipalityDate}>
                    {formatDate(m.lastVisitedAt)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* すれ違い相手の都道府県 */}
        {data?.encounterPrefectures && data.encounterPrefectures.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>すれ違い相手の出身地</Text>
            <View style={styles.municipalityList}>
              {data.encounterPrefectures
                .filter((e) => e.prefecture)
                .map((e, i) => (
                  <View key={i} style={styles.municipalityRow}>
                    <Text style={styles.municipalityPrefecture}>{e.prefecture}</Text>
                    <View style={[styles.encounterBadge, { backgroundColor: color.accentAlt + "33" }]}>
                      <Text style={[styles.encounterBadgeText, { color: color.accentAlt }]}>
                        {e.encounterCount} 件
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}

        {data?.visited?.length === 0 && data?.encounterPrefectures?.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="explore-off" size={48} color={color.textMuted} />
            <Text style={styles.emptyText}>
              チェックインすると{"\n"}訪問地図が埋まります
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: "100%",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: color.textMuted,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
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
  // Legend
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: color.textMuted,
    fontSize: 11,
  },
  // Section title
  sectionTitle: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trailMapSection: {
    marginBottom: 20,
  },
  trailMapCaption: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },

  // Municipality list
  municipalityList: {
    gap: 2,
    marginBottom: 20,
  },
  municipalityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: color.surface,
    borderRadius: 10,
    marginBottom: 2,
  },
  municipalityInfo: {
    flex: 1,
  },
  municipalityPrefecture: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  municipalityVisitCount: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  municipalityDate: {
    color: color.textMuted,
    fontSize: 11,
  },
  encounterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  encounterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  // Login gate
  loginGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loginGateTitle: {
    color: color.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginGateSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
