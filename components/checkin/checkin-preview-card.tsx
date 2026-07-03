/**
 * チェックイン保存前プレビュー（docs/uiux-brushup-SPEC.md §2.2/2.5）
 *
 * 測位確定後、保存前に「何を残すか」を可視化する。
 * ミニ地図 + 精度円 + 精度コピー + 市区町村。保存はブロックしない
 * （精度が悪くても「もう一度測る」を提示するだけ）。
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, contentMaxWidth, borderRadius, spacing } from "@/theme/tokens";
import { LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { getAccuracyHeadline, isAccuracyLow } from "@/lib/accuracy-copy";

type CheckinPreviewCardProps = {
  mapPoint: TrailPoint;
  mapCenter: { lat: number; lng: number };
  mapHeight: number;
  mapWidth: number;
  accuracyM: number | null;
  placeLabel: string | null;
  userImageUrl?: string;
  isRetrying: boolean;
  /** 地図をクリックしてピンを手動修正できるか（PCブラウザ限定） */
  interactive?: boolean;
  onCoordinateSelect?: (coords: { lat: number; lng: number }) => void;
  onRetry: () => void;
  onSave: () => void;
};

export function CheckinPreviewCard({
  mapPoint,
  mapCenter,
  mapHeight,
  mapWidth,
  accuracyM,
  placeLabel,
  userImageUrl,
  isRetrying,
  interactive = false,
  onCoordinateSelect,
  onRetry,
  onSave,
}: CheckinPreviewCardProps) {
  const lowAccuracy = isAccuracyLow(accuracyM);

  return (
    <View style={styles.card}>
      <View style={styles.mapWrap}>
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
            interactive={interactive}
            onCoordinateSelect={onCoordinateSelect}
          />
        </MapErrorBoundary>
      </View>

      <Text style={styles.accuracyHeadline}>{getAccuracyHeadline(accuracyM)}</Text>

      {placeLabel ? (
        <Text style={styles.placeLabel} numberOfLines={2}>
          {placeLabel}
        </Text>
      ) : null}

      {interactive ? (
        <Text style={styles.interactiveHint}>地図をクリックして正しい位置に直せます</Text>
      ) : null}

      {lowAccuracy ? (
        <Pressable
          onPress={onRetry}
          disabled={isRetrying}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && !isRetrying && { opacity: 0.75 },
            isRetrying && { opacity: 0.6 },
          ]}
          accessibilityLabel="もう一度測る"
        >
          <MaterialIcons name="refresh" size={16} color={color.accentIndigo} />
          <Text style={styles.retryButtonText}>
            {isRetrying ? "測位中…" : "もう一度測る"}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onSave}
        style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
        accessibilityLabel="この場所に足あとを残す"
        testID="checkin-save-button"
      >
        <MaterialIcons name="check" size={20} color={color.textWhite} />
        <Text style={styles.saveButtonText}>この場所に足あとを残す</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  mapWrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  mapInner: {
    borderRadius: borderRadius.md,
    width: "100%",
  },
  accuracyHeadline: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  placeLabel: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  interactiveHint: {
    color: color.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.accentIndigo,
    backgroundColor: color.surface,
  },
  retryButtonText: {
    color: color.accentIndigo,
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: borderRadius.md,
    backgroundColor: color.accentIndigo,
  },
  saveButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "800",
  },
});
