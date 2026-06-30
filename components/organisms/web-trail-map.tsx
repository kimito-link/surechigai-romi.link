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
  Pressable,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  PrecisionTileMap,
  formatPlace,
  formatDateTime,
  formatCoordinate,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { color } from "@/theme/tokens";

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
        <>
          <Text style={styles.sectionTitle}>最近の移動履歴</Text>
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
              {canDeleteLocations && onDeleteLocation ? (
                <Pressable
                  onPress={() => onDeleteLocation(point.id)}
                  disabled={deletingLocationId === point.id}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && { opacity: 0.7 },
                    deletingLocationId === point.id && { opacity: 0.5 },
                  ]}
                  accessibilityLabel="この足あとを削除"
                >
                  {deletingLocationId === point.id ? (
                    <ActivityIndicator size="small" color={color.danger} />
                  ) : (
                    <MaterialIcons name="delete-outline" size={20} color={color.danger} />
                  )}
                </Pressable>
              ) : null}
            </View>
          ))}
        </>
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
  deleteButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: color.danger + "12",
    borderWidth: 1,
    borderColor: color.danger + "33",
  },
});
