/**
 * RankingHeader - ランキングヘッダー
 * 
 * 単一責任: ヘッダー部分の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import type { RankingHeaderProps } from "./types";

export function RankingHeader({ title, avgContribution }: RankingHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MaterialIcons name="emoji-events" size={24} color={color.rankGold} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.headerStats}>
        <Text style={styles.statText}>平均: {avgContribution}貢献</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerStats: {
    backgroundColor: color.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    color: color.textMuted,
    fontSize: 12,
  },
  title: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
});
