/**
 * 足あと履歴リスト（軌跡タブ・図鑑で共通）。
 * 1行から公開/非公開の切り替えと削除ができる。
 */
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  formatPlace,
  formatDateTime,
  formatCoordinate,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { color } from "@/theme/tokens";
import {
  locationVisibilityLabel,
  parseLocationVisibility,
  type LocationVisibility,
} from "@/modules/encounter/core/location-visibility";

type TrailHistoryListProps = {
  locations: TrailPoint[];
  limit?: number;
  canManage?: boolean;
  onDeleteLocation?: (locationId: number) => void;
  onToggleVisibility?: (locationId: number, next: LocationVisibility) => void;
  deletingLocationId?: number | null;
  updatingLocationId?: number | null;
};

export function TrailHistoryList({
  locations,
  limit = 30,
  canManage = false,
  onDeleteLocation,
  onToggleVisibility,
  deletingLocationId = null,
  updatingLocationId = null,
}: TrailHistoryListProps) {
  if (locations.length === 0) return null;

  const shown = locations.slice(0, limit);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>最近の移動履歴</Text>
        {canManage ? (
          <Text style={styles.hint}>タップで公開/非公開</Text>
        ) : null}
      </View>

      {shown.map((point, index) => {
        const visibility = parseLocationVisibility(point.visibility);
        const isPublic = visibility === "public";
        const busy =
          deletingLocationId === point.id || updatingLocationId === point.id;

        return (
          <View key={point.id} style={styles.trailRow}>
            <View
              style={[
                styles.trailDot,
                index === 0 && styles.trailDotLatest,
                !isPublic && styles.trailDotPrivate,
              ]}
            />
            <View style={styles.trailInfo}>
              <Text style={styles.trailPref} numberOfLines={2}>
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

            {canManage && onToggleVisibility ? (
              <Pressable
                onPress={() =>
                  onToggleVisibility(
                    point.id,
                    isPublic ? "private" : "public",
                  )
                }
                disabled={busy}
                style={({ pressed }) => [
                  styles.visibilityButton,
                  isPublic ? styles.visibilityPublic : styles.visibilityPrivate,
                  pressed && { opacity: 0.75 },
                  busy && { opacity: 0.5 },
                ]}
                accessibilityLabel={`${locationVisibilityLabel(visibility)}。タップで切り替え`}
              >
                {updatingLocationId === point.id ? (
                  <ActivityIndicator size="small" color={color.accentIndigo} />
                ) : (
                  <Text
                    style={[
                      styles.visibilityText,
                      isPublic ? styles.visibilityTextPublic : styles.visibilityTextPrivate,
                    ]}
                  >
                    {locationVisibilityLabel(visibility)}
                  </Text>
                )}
              </Pressable>
            ) : null}

            {canManage && onDeleteLocation ? (
              <Pressable
                onPress={() => onDeleteLocation(point.id)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && { opacity: 0.7 },
                  busy && { opacity: 0.5 },
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
        );
      })}

      {locations.length > limit ? (
        <Text style={styles.moreHint}>
          ほか {locations.length - limit} 件（地図上には最新 {limit} 件を表示）
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 980,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  hint: {
    color: color.textMuted,
    fontSize: 11,
  },
  trailRow: {
    width: "100%",
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
    flexShrink: 0,
  },
  trailDotLatest: {
    backgroundColor: color.accentIndigo,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trailDotPrivate: {
    backgroundColor: color.textMuted,
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
    marginLeft: 8,
    flexShrink: 0,
  },
  trailCountText: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "800",
  },
  visibilityButton: {
    marginLeft: 8,
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  visibilityPublic: {
    backgroundColor: color.accentIndigo + "18",
    borderColor: color.accentIndigo + "55",
  },
  visibilityPrivate: {
    backgroundColor: color.surfaceAlt,
    borderColor: color.border,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: "800",
  },
  visibilityTextPublic: {
    color: color.accentIndigo,
  },
  visibilityTextPrivate: {
    color: color.textMuted,
  },
  deleteButton: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 8,
    backgroundColor: color.danger + "12",
    borderWidth: 1,
    borderColor: color.danger + "33",
    flexShrink: 0,
  },
  moreHint: {
    color: color.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
});
