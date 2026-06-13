/**
 * RankBadge - 順位バッジ
 * 
 * 単一責任: 順位バッジの表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { RANK_COLORS, RANK_ICONS } from "./constants";
import type { RankBadgeProps } from "./types";

export function RankBadge({ rank }: RankBadgeProps) {
  if (rank <= 3) {
    const colors = RANK_COLORS[rank as 1 | 2 | 3];
    const icon = RANK_ICONS[rank as 1 | 2 | 3];

    return (
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topRankBadge}
      >
        <Text style={styles.topRankIcon}>{icon}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  topRankIcon: {
    fontSize: 20,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: color.textMuted,
    fontSize: 14,
    fontWeight: "bold",
  },
});
