/**
 * 足あとカード（ボトムシート）— docs/uiux-brushup-SPEC.md §3.3
 *
 * 地図上のピンをタップした時に下から出る詳細シート。
 * ネストカード禁止のため、シート自体が唯一のカード。
 */

import { View, Text, Pressable, StyleSheet, ActivityIndicator, Modal } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, contentMaxWidth, borderRadius, spacing } from "@/theme/tokens";
import {
  formatPlace,
  formatDateTime,
  formatCoordinate,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { NavigateToPlaceButton } from "@/components/molecules/navigate-to-place-button";
import {
  locationVisibilityLabel,
  parseLocationVisibility,
  type LocationVisibility,
} from "@/modules/encounter/core/location-visibility";

type FootprintSheetProps = {
  point: TrailPoint | null;
  visible: boolean;
  onClose: () => void;
  canManage?: boolean;
  onDeleteLocation?: (locationId: number) => void;
  onToggleVisibility?: (locationId: number, next: LocationVisibility) => void;
  isDeleting?: boolean;
  isUpdatingVisibility?: boolean;
};

export function FootprintSheet({
  point,
  visible,
  onClose,
  canManage = false,
  onDeleteLocation,
  onToggleVisibility,
  isDeleting = false,
  isUpdatingVisibility = false,
}: FootprintSheetProps) {
  if (!point) return null;

  const visibility = parseLocationVisibility(point.visibility);
  const isPublic = visibility === "public";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.place} numberOfLines={3}>
            {formatPlace(point)}
          </Text>
          <Text style={styles.meta}>{formatDateTime(point.recordedAt)}</Text>
          <Text style={styles.coord}>
            {formatCoordinate(point)}
            {point.accuracyM ? `  ±${Math.round(point.accuracyM)}m` : ""}
          </Text>

          <View style={styles.actionRow}>
            <NavigateToPlaceButton
              lat={point.lat}
              lng={point.lng}
              placeLabel={formatPlace(point)}
              label="ここへ向かう"
              fullWidth
              testID="footprint-sheet-navigate"
            />
          </View>

          {canManage ? (
            <View style={styles.manageRow}>
              {onToggleVisibility ? (
                <Pressable
                  onPress={() => onToggleVisibility(point.id, isPublic ? "private" : "public")}
                  disabled={isUpdatingVisibility}
                  style={({ pressed }) => [
                    styles.manageButton,
                    isPublic ? styles.manageButtonPublic : styles.manageButtonPrivate,
                    pressed && !isUpdatingVisibility && { opacity: 0.75 },
                    isUpdatingVisibility && { opacity: 0.5 },
                  ]}
                  accessibilityLabel={`${locationVisibilityLabel(visibility)}。タップで切り替え`}
                >
                  {isUpdatingVisibility ? (
                    <ActivityIndicator size="small" color={color.accentIndigo} />
                  ) : (
                    <Text
                      style={[
                        styles.manageButtonText,
                        isPublic ? styles.manageButtonTextPublic : styles.manageButtonTextPrivate,
                      ]}
                    >
                      {locationVisibilityLabel(visibility)}
                    </Text>
                  )}
                </Pressable>
              ) : null}

              {onDeleteLocation ? (
                <Pressable
                  onPress={() => onDeleteLocation(point.id)}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && !isDeleting && { opacity: 0.75 },
                    isDeleting && { opacity: 0.5 },
                  ]}
                  accessibilityLabel="この足あとを削除"
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={color.danger} />
                  ) : (
                    <>
                      <MaterialIcons name="delete-outline" size={18} color={color.danger} />
                      <Text style={styles.deleteButtonText}>削除</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="閉じる">
            <Text style={styles.closeButtonText}>閉じる</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    backgroundColor: color.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.border,
    marginBottom: spacing.sm,
  },
  place: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  meta: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  coord: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  actionRow: {
    marginTop: spacing.sm,
  },
  manageRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  manageButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  manageButtonPublic: {
    backgroundColor: color.accentIndigo + "18",
    borderColor: color.accentIndigo + "55",
  },
  manageButtonPrivate: {
    backgroundColor: color.surfaceAlt,
    borderColor: color.border,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  manageButtonTextPublic: {
    color: color.accentIndigo,
  },
  manageButtonTextPrivate: {
    color: color.textMuted,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.danger + "44",
    backgroundColor: color.danger + "10",
  },
  deleteButtonText: {
    color: color.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  closeButtonText: {
    color: color.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
});
