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
} from "react-native";
import { useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { GlobalLoginGate } from "@/components/organisms/global-login-gate";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { prefectures } from "@/constants/prefectures";
import { JapanBlockMap } from "@/components/organisms/japan-block-map";
import { useRouter } from "expo-router";



export default function ZukanScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReady } = useAuth();
  const router = useRouter();

  const { data, refetch, isFetching } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

  if (!isAuthenticated) {
    return (
      <GlobalLoginGate
        title="図鑑"
        subtitle={`訪問した都道府県や\nすれ違い相手の出身地が記録されます`}
        headerTitle="図鑑"
        isDesktop={isDesktop}
      />
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
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={color.accentAlt}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
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

        {/* 市区町村リスト */}
        {data?.visited && data.visited.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>訪問した市区町村</Text>
            <View style={styles.municipalityList}>
              {data.visited
                .filter((v) => v.prefecture)
                .sort((a, b) => b.visitCount - a.visitCount)
                .map((v, i) => (
                  <View key={i} style={styles.municipalityRow}>
                    <View style={styles.municipalityInfo}>
                      <Text style={styles.municipalityPrefecture}>{v.prefecture}</Text>
                      <Text style={styles.municipalityVisitCount}>
                        {v.visitCount} 回訪問
                      </Text>
                    </View>
                    <Text style={styles.municipalityDate}>
                      {formatDate(v.lastVisitedAt)}
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
