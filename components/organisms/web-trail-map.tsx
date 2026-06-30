/**
 * Web 向け軌跡マップ（自分の軌跡タブ / 公開 /u/<slug> で共有）。
 * surechigai-nico の一覧タップ後に見せる地図 UI のベース。
 */
import type { ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  PrecisionTileMap,
  fitCenterZoom,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { color } from "@/theme/tokens";
import { TrailHistoryList } from "@/components/molecules/trail-history-list";
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
  style?: StyleProp<ViewStyle>;
};

export function WebTrailMap({
  visited,
  locations,
  municipalityCount,
  encounterCount = 0,
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
      {locations.length > 0 ? (
        <PrecisionTileMap locations={locations} userImageUrl={userImageUrl} />
      ) : (
        <View style={styles.emptyMap}>
          <MaterialIcons name="near-me-disabled" size={48} color={color.textMuted} />
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>
            {encounterCount}
          </Text>
          <Text style={styles.summaryLabel}>すれ違い</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentAlt }]}>{total}</Text>
          <Text style={styles.summaryLabel}>図鑑（チェックイン）</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.success }]}>
            {municipalityTotal}
          </Text>
          <Text style={styles.summaryLabel}>市区町村</Text>
        </View>
      </View>

      {locations.length > 0 ? (
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
});
