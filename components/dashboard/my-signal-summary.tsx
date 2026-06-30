import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMySignal } from "@/hooks/use-my-signal";
import { color, palette } from "@/theme/tokens";

function StatCell({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.cell}>
      <MaterialIcons name={icon} size={18} color={palette.kimitoBlue} />
      <Text style={styles.cellValue}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

/** マイページ最上部 — My Signal サマリー */
export function MySignalSummary() {
  const { data, isLoading } = useMySignal();

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loading]}>
        <ActivityIndicator color={palette.kimitoBlue} />
      </View>
    );
  }

  if (!data) return null;

  const latest =
    data.latestPlaceLabel && data.latestRecordedAt
      ? `${data.latestPlaceLabel}`
      : "まだ記録なし";

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>My Signal</Text>
      <Text style={styles.latest} numberOfLines={1}>
        {latest}
      </Text>
      <View style={styles.grid}>
        <StatCell icon="map" label="足あと" value={String(data.trailCount)} />
        <StatCell icon="mail" label="未開封" value={String(data.unopenedCount)} />
        <StatCell icon="people" label="すれ違い" value={String(data.encounterPartnerCount)} />
        <StatCell icon="public" label="都道府県" value={String(data.visitedPrefectureCount)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: color.border,
  },
  loading: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.kimitoBlue,
    letterSpacing: 0.5,
  },
  latest: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  cell: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: color.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  cellValue: {
    fontSize: 18,
    fontWeight: "800",
    color: color.textPrimary,
  },
  cellLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: color.textMuted,
  },
});
