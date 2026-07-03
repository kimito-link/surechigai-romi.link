/**
 * 図鑑コンプリートヘッダー（docs/uiux-brushup-SPEC.md §4.2）
 *
 * 「{n} / 47 都道府県」を大きく見せ、達成の全体感を1画面の最上部で伝える。
 */

import { View, Text, StyleSheet } from "react-native";
import { color, spacing, borderRadius } from "@/theme/tokens";

const TOTAL_PREFECTURES = 47;

type ZukanCompleteHeaderProps = {
  visitedPrefectureCount: number;
  municipalityCount: number;
  encounterPartnerCount: number;
};

export function ZukanCompleteHeader({
  visitedPrefectureCount,
  municipalityCount,
  encounterPartnerCount,
}: ZukanCompleteHeaderProps) {
  const progress = Math.min(1, visitedPrefectureCount / TOTAL_PREFECTURES);

  return (
    <View style={styles.wrap}>
      <View style={styles.heroRow}>
        <Text style={styles.heroNumber}>{visitedPrefectureCount}</Text>
        <Text style={styles.heroTotal}>{" "}/ {TOTAL_PREFECTURES} 都道府県</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.summaryLine}>
        {municipalityCount} 市区町村 · すれ違い {encounterPartnerCount} 人
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heroNumber: {
    color: color.accentPrimary,
    fontSize: 30,
    fontWeight: "800",
  },
  heroTotal: {
    color: color.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: color.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.sm,
    backgroundColor: color.accentPrimary,
  },
  summaryLine: {
    color: color.textMuted,
    fontSize: 13,
  },
});
