/**
 * 図鑑画面（認証済み）— 地図 chunk / tRPC は lazy 読み込み後のみ。
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
import MaterialIcons from "@/lib/icons/material-icons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { trpc } from "@/lib/trpc";
import { color, palette, contentMaxWidth } from "@/theme/tokens";
import { fitCenterZoom, type TrailPoint } from "@/lib/map/tile-geo";
import { LazyJapanBlockMap, LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import { navigate } from "@/lib/navigation";
import { AUTHENTICATED_QUERY_OPTIONS } from "@/lib/authenticated-query-options";
import { TabMapLoadingFallback } from "@/components/molecules/tab-query-shell";
import { TrailHistoryList } from "@/components/molecules/trail-history-list";
import { DeleteTrailConfirmModal } from "@/components/molecules/delete-trail-confirm-modal";
import { useTrailLocationActions } from "@/hooks/use-trail-location-actions";
import { ZukanCompleteHeader } from "@/components/zukan/zukan-complete-header";
import { MunicipalityStampCard } from "@/components/zukan/municipality-stamp-card";

export function ZukanAuthenticatedScreen() {
  const { isDesktop } = useResponsive();
  const tabInset = useTabBarInset();
  const { width: windowWidth } = useWindowDimensions();

  const { data, refetch, isFetching, isLoading: isLoadingAreas } = trpc.zukan.myAreas.useQuery(undefined, {
    ...AUTHENTICATED_QUERY_OPTIONS,
  });

  const {
    data: trailData,
    refetch: refetchTrail,
    isLoading: isLoadingTrail,
  } = trpc.zukan.myTrail.useQuery(
    { limit: 500 },
    { ...AUTHENTICATED_QUERY_OPTIONS },
  );
  const { data: activeData, refetch: refetchActive } = trpc.zukan.activePrefectures.useQuery(
    undefined,
    { ...AUTHENTICATED_QUERY_OPTIONS, staleTime: 60_000 },
  );
  const trailLocations: TrailPoint[] = trailData?.locations ?? [];
  const isLoading = isLoadingAreas || isLoadingTrail;

  const activePrefSet = useMemo(
    () => new Set((activeData?.prefectures ?? []).map((p) => p.prefecture)),
    [activeData],
  );

  const mapW = Math.max(320, Math.min(windowWidth - 32, 980));
  const mapH = windowWidth < 640 ? 340 : 460;
  const { center: trailCenter, zoom: trailZoom } = useMemo(
    () => fitCenterZoom(trailLocations, mapW, mapH),
    [trailLocations, mapW, mapH],
  );

  const onRefresh = useCallback(() => {
    refetch();
    refetchTrail();
    refetchActive();
  }, [refetch, refetchTrail, refetchActive]);

  const {
    deletingLocationId,
    updatingLocationId,
    confirmDeleteId,
    handleDeleteLocation,
    handleToggleVisibility,
    executeDelete,
    cancelDelete,
  } = useTrailLocationActions(onRefresh);

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
    {} as Record<string, number>,
  );

  const municipalitySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        municipality: string;
        prefecture: string | null;
        visitCount: number;
        lastVisitedAt: Date | string;
        firstVisitedAt: Date | string;
      }
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
        if (new Date(v.firstVisitedAt) < new Date(prev.firstVisitedAt)) {
          prev.firstVisitedAt = v.firstVisitedAt;
        }
      } else {
        map.set(key, {
          municipality: name,
          prefecture: v.prefecture,
          visitCount: v.visitCount,
          lastVisitedAt: v.lastVisitedAt,
          firstVisitedAt: v.firstVisitedAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.visitCount - a.visitCount);
  }, [data]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <TabScreenHeader
        title="みんなの現在地"
        contextKey="zukan"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
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
        <View style={styles.pageBody}>
          <Text style={styles.sectionTitle}>みんながいる現在地（都道府県別）</Text>
          {activeData && activeData.totalPeople > 0 ? (
            <Text style={styles.sectionLead}>
              直近24時間で {activeData.totalPeople} 人が公開中の足あとを残しています
            </Text>
          ) : null}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: palette.kimitoBlue }]} />
              <Text style={styles.legendText}>いま記録中</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color.accentIndigo }]} />
              <Text style={styles.legendText}>あなたの訪問</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color.accentAlt }]} />
              <Text style={styles.legendText}>すれ違い相手</Text>
            </View>
          </View>

          <LazyJapanBlockMap
            visitedPrefSet={visitedPrefSet}
            encounteredPrefSet={encounteredPrefSet}
            activePrefSet={activePrefSet}
            encounterCountMap={encounterCountMap}
            onPressPrefecture={(pref) => {
              navigate.toZukanPrefecture(pref);
            }}
          />

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>あなたの記録</Text>
          <ZukanCompleteHeader
            visitedPrefectureCount={visitedCount}
            municipalityCount={municipalitySummary.length}
            encounterPartnerCount={data?.encounterPartnerCount ?? 0}
          />
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>
                {isLoading ? "—" : visitedCount}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={2}>
                訪問した都道府県
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: color.accentAlt }]}>
                {isLoading ? "—" : encounteredCount}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={2}>
                すれ違い都道府県
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: color.accentPrimary }]}>
                {isLoading ? "—" : (data?.encounterPartnerCount ?? 0)}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={2}>
                すれ違った人
              </Text>
            </View>
          </View>

          {isLoading ? (
            <TabMapLoadingFallback minHeight={280} />
          ) : trailLocations.length > 0 ? (
            <View style={styles.trailMapSection}>
              <Text style={styles.sectionTitle}>あなたの足あと（全国）</Text>
              <LazyPrecisionTileMap
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
              <View style={styles.trailHistoryWrap}>
                <TrailHistoryList
                  locations={trailLocations}
                  limit={30}
                  canManage
                  onDeleteLocation={handleDeleteLocation}
                  onToggleVisibility={handleToggleVisibility}
                  deletingLocationId={deletingLocationId}
                  updatingLocationId={updatingLocationId}
                />
              </View>
            </View>
          ) : null}

          {municipalitySummary.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>訪問した市区町村（切手帳）</Text>
              <View style={styles.stampGrid}>
                {municipalitySummary.map((m, i) => (
                  <MunicipalityStampCard
                    key={i}
                    municipality={m.municipality}
                    prefecture={m.prefecture}
                    visitCount={m.visitCount}
                    firstVisitedAt={m.firstVisitedAt}
                    onPress={() =>
                      navigate.toMapTab({ municipality: m.municipality })
                    }
                  />
                ))}
              </View>
            </>
          )}

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

          {!isLoading && data?.visited?.length === 0 && data?.encounterPrefectures?.length === 0 && (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="explore-off" size={48} color={color.textMuted} />
              <Text style={styles.emptyText}>
                チェックインすると{"\n"}訪問地図が埋まります
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <DeleteTrailConfirmModal
        visible={confirmDeleteId != null}
        onConfirm={executeDelete}
        onCancel={cancelDelete}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  pageBody: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
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
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  sectionTitle: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  sectionLead: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
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
  trailHistoryWrap: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
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
  municipalityPrefecture: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  stampGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
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
});
