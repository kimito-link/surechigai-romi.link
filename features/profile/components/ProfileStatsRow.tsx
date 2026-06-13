/**
 * features/profile/components/ProfileStatsRow.tsx
 * プロフィール統計行（総貢献度・参加チャレンジ・主催数）
 */

import { View, Text, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";

interface ProfileStatsRowProps {
  totalContribution: number;
  participationCount: number;
  hostedCount: number;
}

export const ProfileStatsRow = ({
  totalContribution,
  participationCount,
  hostedCount,
}: ProfileStatsRowProps) => (
  <View style={styles.container}>
    <View style={styles.cell}>
      <Text style={styles.valueContribution}>{totalContribution}</Text>
      <Text style={styles.label}>総貢献度</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.cell}>
      <Text style={styles.valueParticipation}>{participationCount}</Text>
      <Text style={styles.label}>参加チャレンジ</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.cell}>
      <Text style={styles.valueHosted}>{hostedCount}</Text>
      <Text style={styles.label}>主催数</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: color.surfaceDark,
    padding: 16,
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: color.border,
  },
  // 大きい数値（fontSize 24）は既存デザインを維持。accentPrimaryAA は 18未満専用
  valueContribution: {
    color: color.hostAccentLegacy,
    fontSize: 24,
    fontWeight: "bold",
  },
  valueParticipation: {
    color: color.accentPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  valueHosted: {
    color: color.accentAlt,
    fontSize: 24,
    fontWeight: "bold",
  },
  label: {
    color: color.textMuted,
    fontSize: 12,
  },
});
