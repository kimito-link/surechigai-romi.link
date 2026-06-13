/**
 * HeatmapLegend - ヒートマップの凡例
 * 
 * 単一責任: 色の凡例表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";

/** 温度グラデーション: 少（ベージュ）→ 多（濃い赤）。最高状態で日本列島が赤く染まる */
const HEAT_LEVELS = [
  color.heatmapLevel1,
  color.heatmapLevel2,
  color.heatmapLevel3,
  color.heatmapLevel4,
  color.heatmapLevel5,
  color.heatmapLevel6,
  color.heatmapLevel7,
] as const;

export function HeatmapLegend() {
  return (
    <View style={styles.legend}>
      <Text style={styles.legendText}>少</Text>
      {HEAT_LEVELS.map((c, i) => (
        <View key={i} style={[styles.legendColor, { backgroundColor: c }]} />
      ))}
      <Text style={styles.legendText}>多</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 2,
  },
  legendColor: {
    width: 20,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: palette.white + "33", // 20% opacity
  },
  legendText: {
    color: color.textMuted,
    fontSize: 12,
    marginHorizontal: 4,
  },
});
