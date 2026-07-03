/**
 * Web 向け軌跡マップ（自分の軌跡タブ / 公開 /u/<slug> で共有）。
 * surechigai-nico の一覧タップ後に見せる地図 UI のベース。
 */
import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import {
  PrecisionTileMap,
  fitCenterZoom,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { color, contentMaxWidth } from "@/theme/tokens";
import { TrailHistoryList } from "@/components/molecules/trail-history-list";
import { TabMapLoadingFallback, TabQueryShell } from "@/components/molecules/tab-query-shell";
import { FootprintSheet } from "@/components/map/footprint-sheet";
import type { LocationVisibility } from "@/modules/encounter/core/location-visibility";

export type VisitedAreaSummary = {
  prefecture: string | null;
  municipality?: string | null;
  visitCount: number;
  lastVisitedAt: Date | string;
};

type WebTrailMapProps = {
  visited: VisitedAreaSummary[];
  locations: TrailPoint[];
  municipalityCount?: number;
  encounterCount?: number;
  isLoading?: boolean;
  isFetching?: boolean;
  onRefresh?: () => void;
  userImageUrl?: string;
  topContent?: ReactNode;
  contentPaddingBottom?: number;
  emptyTitle?: string;
  emptyText?: string;
  canDeleteLocations?: boolean;
  onDeleteLocation?: (locationId: number) => void;
  deletingLocationId?: number | null;
  onToggleVisibility?: (locationId: number, next: LocationVisibility) => void;
  updatingLocationId?: number | null;
  historyLimit?: number;
  /** 公開閲覧向け: 履歴ヘッダーに保存地点の注記 */
  showSavedLocationHint?: boolean;
  /** Zukanの切手カードから遷移: この市区町村の最新地点にフォーカスする（docs/uiux-brushup-SPEC.md §4.5） */
  focusMunicipality?: string;
  /** Check-in成功パネルから遷移: この location にフォーカスしシートを開く（docs/uiux-brushup-SPEC.md §3.2 P0） */
  focusLocationId?: number;
  style?: StyleProp<ViewStyle>;
};

export function WebTrailMap({
  visited,
  locations,
  municipalityCount,
  encounterCount = 0,
  isLoading = false,
  isFetching = false,
  onRefresh,
  userImageUrl,
  topContent,
  contentPaddingBottom,
  emptyTitle = "まだ正確な足あとがありません",
  emptyText = "チェックインすると、道路や建物の位置まで辿れる精度で記録されます",
  canDeleteLocations = false,
  onDeleteLocation,
  deletingLocationId = null,
  onToggleVisibility,
  updatingLocationId = null,
  historyLimit = 30,
  showSavedLocationHint = false,
  focusMunicipality,
  focusLocationId,
  style,
}: WebTrailMapProps) {
  const total = visited.reduce((s, v) => s + v.visitCount, 0);
  const municipalityTotal =
    municipalityCount ??
    new Set(
      visited
        .map((v) => v.municipality || v.prefecture)
        .filter((name): name is string => !!name),
    ).size;

  const [zoom, setZoom] = useState(18);
  const [selectedPoint, setSelectedPoint] = useState<TrailPoint | null>(null);
  const [focusCenter, setFocusCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const appliedFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (locations.length === 0) return;
    const focusKey = `${focusMunicipality ?? ""}:${focusLocationId ?? ""}`;
    if (!focusMunicipality && focusLocationId == null) return;
    if (appliedFocusRef.current === focusKey) return;

    const target = focusLocationId != null
      ? locations.find((l) => l.id === focusLocationId)
      : locations.find((l) => (l.municipality ?? l.address ?? "") === focusMunicipality);

    if (target) {
      appliedFocusRef.current = focusKey;
      setFocusCenter({ lat: target.lat, lng: target.lng });
      setZoom(17);
      if (focusLocationId != null) {
        setSelectedPoint(target);
      }
    }
  }, [locations, focusMunicipality, focusLocationId]);

  return (
    <ScrollView
      style={style}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={color.accentIndigo}
          />
        ) : undefined
      }
      contentContainerStyle={[
        styles.scrollContent,
        contentPaddingBottom ? { paddingBottom: contentPaddingBottom } : null,
      ]}
    >
      {topContent}
      <TabQueryShell
        isLoading={isLoading}
        isEmpty={locations.length === 0}
        keepContentWhileRefetching={locations.length > 0}
        loadingFallback={<TabMapLoadingFallback minHeight={320} />}
        emptyFallback={
          <View style={styles.emptyMap}>
            <MaterialIcons name="near-me-disabled" size={48} color={color.textMuted} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
      >
        <PrecisionTileMap
          locations={locations}
          userImageUrl={userImageUrl}
          zoom={zoom}
          customCenter={focusCenter}
          onZoomChange={setZoom}
          onPointPress={setSelectedPoint}
        />
      </TabQueryShell>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>
            {isLoading ? "—" : encounterCount}
          </Text>
          <Text style={styles.summaryLabel}>すれ違った人</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentAlt }]}>
            {isLoading ? "—" : total}
          </Text>
          <Text style={styles.summaryLabel}>図鑑（チェックイン）</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.success }]}>
            {isLoading ? "—" : municipalityTotal}
          </Text>
          <Text style={styles.summaryLabel}>市区町村</Text>
        </View>
      </View>

      {!isLoading && locations.length > 0 ? (
        <TrailHistoryList
          locations={locations}
          limit={historyLimit}
          canManage={canDeleteLocations}
          showSavedLocationHint={showSavedLocationHint}
          onDeleteLocation={onDeleteLocation}
          onToggleVisibility={onToggleVisibility}
          deletingLocationId={deletingLocationId}
          updatingLocationId={updatingLocationId}
        />
      ) : null}

      <FootprintSheet
        point={selectedPoint}
        visible={selectedPoint != null}
        onClose={() => setSelectedPoint(null)}
        canManage={canDeleteLocations}
        onDeleteLocation={
          onDeleteLocation
            ? (locationId) => {
                onDeleteLocation(locationId);
                setSelectedPoint(null);
              }
            : undefined
        }
        onToggleVisibility={onToggleVisibility}
        isDeleting={selectedPoint != null && deletingLocationId === selectedPoint.id}
        isUpdatingVisibility={selectedPoint != null && updatingLocationId === selectedPoint.id}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  emptyMap: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
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
    maxWidth: contentMaxWidth.standard,
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
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
});
