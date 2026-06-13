/**
 * StatsSummary - 統計サマリー
 * 
 * 単一責任: 統計数値の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import type { StatsSummaryProps } from "./types";

export function StatsSummary({ 
  activePrefectureCount, 
  totalCount, 
  maxPrefectureCount 
}: StatsSummaryProps) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{activePrefectureCount}</Text>
        <Text style={styles.statLabel}>都道府県</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalCount.toLocaleString()}</Text>
        <Text style={styles.statLabel}>総参加者</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{maxPrefectureCount.toLocaleString()}</Text>
        <Text style={styles.statLabel}>最多</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: color.textWhite,
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: color.border,
  },
});
