/**
 * チェックイン成功パネル（docs/uiux-brushup-SPEC.md §2.2/2.5）
 *
 * 「足あとを残しました」+ 記録時刻/市区町村 + 出口2つ（地図で見る / Xでシェア）。
 * ピンフォーカスは有限アニメ（withTiming のみ、withRepeat は使わない）。
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, contentMaxWidth, borderRadius, spacing } from "@/theme/tokens";
import { LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { NavigateToPlaceButton } from "@/components/molecules/navigate-to-place-button";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { getAccuracyHeadline } from "@/lib/accuracy-copy";

type CheckinSuccessPanelProps = {
  mapPoint: TrailPoint;
  mapCenter: { lat: number; lng: number };
  mapHeight: number;
  mapWidth: number;
  accuracyM: number | null;
  placeLabel: string | null;
  recordedAtLabel: string;
  newEncounterCount: number;
  userImageUrl?: string;
  onViewMap: () => void;
  onShare: () => void;
  isSharing: boolean;
};

export function CheckinSuccessPanel({
  mapPoint,
  mapCenter,
  mapHeight,
  mapWidth,
  accuracyM,
  placeLabel,
  recordedAtLabel,
  newEncounterCount,
  userImageUrl,
  onViewMap,
  onShare,
  isSharing,
}: CheckinSuccessPanelProps) {
  const focusScale = useSharedValue(0.9);

  useEffect(() => {
    // 有限アニメ1回のみ（withRepeat は使わない — 地雷2の予算内）
    focusScale.value = withSequence(
      withTiming(1.08, { duration: 220 }),
      withTiming(1, { duration: 160 }),
    );
  }, [focusScale]);

  const focusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  return (
    <View style={styles.panel}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>足あとを残しました</Text>
      </View>

      <Animated.View style={[styles.mapWrap, focusStyle]}>
        <MapErrorBoundary mapType="heatmap" height={mapHeight}>
          <LazyPrecisionTileMap
            locations={[mapPoint]}
            customCenter={mapCenter}
            zoom={17}
            showInfoPanel={false}
            height={mapHeight}
            width={mapWidth}
            markerSize={28}
            containerStyle={styles.mapInner}
            userImageUrl={userImageUrl}
          />
        </MapErrorBoundary>
      </Animated.View>

      {placeLabel ? (
        <Text style={styles.placeLabel} numberOfLines={2}>
          {placeLabel}
        </Text>
      ) : null}
      <Text style={styles.metaLine}>
        {recordedAtLabel} · {getAccuracyHeadline(accuracyM)}
      </Text>

      {newEncounterCount > 0 ? (
        <Text style={styles.encounterLine}>{newEncounterCount}件のすれ違いが届きました！</Text>
      ) : (
        <Text style={styles.encounterLine}>まだ誰も… あなたの軌跡が誰かの封筒になります</Text>
      )}

      <View style={styles.exitRow}>
        <Pressable
          onPress={onViewMap}
          style={({ pressed }) => [styles.exitButtonPrimary, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="地図で見る"
        >
          <MaterialIcons name="map" size={18} color={color.textWhite} />
          <Text style={styles.exitButtonPrimaryText}>地図で見る</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          disabled={isSharing}
          style={({ pressed }) => [
            styles.exitButtonSecondary,
            pressed && !isSharing && { opacity: 0.85 },
            isSharing && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Xでシェア"
          testID="checkin-share-button"
        >
          <MaterialIcons name="ios-share" size={18} color={color.textPrimary} />
          <Text style={styles.exitButtonSecondaryText}>
            {isSharing ? "準備中…" : "Xでシェア"}
          </Text>
        </Pressable>
      </View>

      <NavigateToPlaceButton
        lat={mapPoint.lat}
        lng={mapPoint.lng}
        placeLabel={placeLabel ?? undefined}
        label="この場所へ向かう"
        fullWidth
        testID="checkin-success-navigate-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  banner: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  bannerText: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  mapWrap: {
    width: "100%",
    alignItems: "center",
  },
  mapInner: {
    borderRadius: borderRadius.md,
    width: "100%",
  },
  placeLabel: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  metaLine: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  encounterLine: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  exitRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  exitButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: borderRadius.md,
    backgroundColor: color.accentIndigo,
  },
  exitButtonPrimaryText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "800",
  },
  exitButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  exitButtonSecondaryText: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
