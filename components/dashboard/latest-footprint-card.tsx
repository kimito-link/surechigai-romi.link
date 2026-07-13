/**
 * 「最新の足あと」カード（マイページ）
 *
 * docs/investigation/dashboard-redesign-2026-07-14.md Step3。
 * MySignalSummary.latestLocation(座標)を使い、場所名+時刻+精度+小さな地図+
 * 2アクション(地図で見る/もう一度チェックイン)を1枚にまとめる。
 * 地図はLazyPrecisionTileMap(既にチェックイン画面で実戦投入済み・アニメ0本)を
 * 流用。ホーム画面には置かない(OOM予算とJapanRadarMapとの重複のため)。
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { formatDateTime } from "@/components/organisms/precision-tile-map";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { navigate } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";
import { CheckinCtaButton } from "@/components/molecules/checkin-cta-button";
import { useMySignal } from "@/hooks/use-my-signal";
import { useAuth } from "@/hooks/use-auth";
import { isInitialQueryLoad } from "@/lib/authenticated-query-options";

const CARD_MAP_HEIGHT = 140;

function formatAccuracy(accuracyM: number | null | undefined): string | null {
  if (accuracyM == null || !Number.isFinite(accuracyM)) return null;
  return `±${Math.round(accuracyM)}m`;
}

/** マイページ — 最新の足あと（場所名+時刻+精度+小さな地図+2アクション） */
export function LatestFootprintCard() {
  const { data, isLoading } = useMySignal();
  const { user } = useAuth();
  const initial = isInitialQueryLoad(isLoading, data);

  if (initial) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>最新の足あと</Text>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View style={[styles.skeletonMap, { height: CARD_MAP_HEIGHT }]} />
      </View>
    );
  }

  const latestPlaceLabel = data?.latestPlaceLabel ?? null;
  const latestRecordedAt = data?.latestRecordedAt ?? null;
  const latestLocation = data?.latestLocation ?? null;
  const checkedInToday = data?.checkedInToday ?? false;

  if (!latestLocation || !latestRecordedAt) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>最新の足あと</Text>
        <Text style={styles.emptyText}>まだ足あとがありません</Text>
        <CheckinCtaButton label="現在地を記録する" compact />
      </View>
    );
  }

  const accuracyLabel = formatAccuracy(latestLocation.accuracyM);
  const mapPoint: TrailPoint = {
    id: 0,
    lat: latestLocation.lat,
    lng: latestLocation.lng,
    accuracyM: latestLocation.accuracyM,
    municipality: null,
    prefecture: null,
    address: latestPlaceLabel,
    recordedAt: latestRecordedAt,
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>最新の足あと</Text>
      <Text style={styles.placeText} numberOfLines={1}>
        {latestPlaceLabel ?? "記録済み"}
      </Text>
      <Text style={styles.metaText}>
        {formatDateTime(latestRecordedAt)}
        {accuracyLabel ? ` · ${accuracyLabel}` : ""}
      </Text>

      <MapErrorBoundary mapType="heatmap" height={CARD_MAP_HEIGHT}>
        <LazyPrecisionTileMap
          locations={[mapPoint]}
          zoom={16}
          showInfoPanel={false}
          height={CARD_MAP_HEIGHT}
          markerSize={24}
          containerStyle={styles.mapInner}
          userImageUrl={user?.profileImage ?? undefined}
        />
      </MapErrorBoundary>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => navigate.toMapTab()}
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <MaterialIcons name="map" size={16} color={color.accentIndigo} />
          <Text style={styles.actionText}>この場所を地図で見る</Text>
        </Pressable>
        <Pressable
          onPress={() => navigate.toCheckinTab()}
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <MaterialIcons name="my-location" size={16} color={color.accentIndigo} />
          <Text style={styles.actionText}>
            {checkedInToday ? "今日もチェックイン" : "もう一度チェックイン"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textMuted,
  },
  placeText: {
    fontSize: 16,
    fontWeight: "800",
    color: color.textPrimary,
  },
  metaText: {
    fontSize: 12,
    color: color.textMuted,
    fontVariant: ["tabular-nums"],
  },
  emptyText: {
    fontSize: 13,
    color: color.textMuted,
  },
  mapInner: {
    borderRadius: 8,
    width: "100%",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: palette.white,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: color.accentIndigo,
  },
  skeletonLine: {
    height: 14,
    width: "80%",
    borderRadius: 4,
    backgroundColor: color.surfaceAlt,
  },
  skeletonMap: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: color.surfaceAlt,
    marginTop: 4,
  },
});
