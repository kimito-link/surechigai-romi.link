import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { useMySignal } from "@/hooks/use-my-signal";
import { isInitialQueryLoad } from "@/lib/authenticated-query-options";
import { navigate } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";

function StatCell({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}を開く`}
      style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
    >
      <MaterialIcons name={icon} size={18} color={palette.kimitoBlue} />
      <Text style={styles.cellValue}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
    </Pressable>
  );
}

function statValue(n: number | undefined, initial: boolean): string {
  if (typeof n === "number") return String(n);
  return initial ? "—" : "0";
}

/** マイページ最上部 — My Signal サマリー */
export function MySignalSummary() {
  const { data, isLoading } = useMySignal();
  const initial = isInitialQueryLoad(isLoading, data);

  const latest =
    data?.latestPlaceLabel && data.latestRecordedAt
      ? data.latestPlaceLabel
      : initial
        ? "—"
        : "まだ記録なし";

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>My Signal</Text>
      <Text style={[styles.latest, initial && styles.latestMuted]} numberOfLines={1}>
        {latest}
      </Text>
      <View style={styles.grid}>
        <StatCell
          icon="map"
          label="足あと"
          value={statValue(data?.trailCount, initial)}
          onPress={() => navigate.toMapTab()}
        />
        <StatCell
          icon="mail"
          label="未開封"
          value={statValue(data?.unopenedCount, initial)}
          onPress={() => navigate.toHome()}
        />
        <StatCell
          icon="people"
          label="すれ違い"
          value={statValue(data?.encounterPartnerCount, initial)}
          onPress={() => navigate.toZukanTab()}
        />
        <StatCell
          icon="public"
          label="都道府県"
          value={statValue(data?.visitedPrefectureCount, initial)}
          onPress={() => navigate.toZukanTab()}
        />
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
  latestMuted: {
    color: color.textMuted,
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
  cellPressed: {
    opacity: 0.82,
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
