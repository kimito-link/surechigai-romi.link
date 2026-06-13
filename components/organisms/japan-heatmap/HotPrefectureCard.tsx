/**
 * HotPrefectureCard - ホットな都道府県のハイライト
 * 
 * 単一責任: 最も参加者が多い都道府県の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";
import type { HotPrefectureCardProps } from "./types";

export function HotPrefectureCard({ prefecture }: HotPrefectureCardProps) {
  if (prefecture.count === 0) {
    return null;
  }

  return (
    <View style={styles.hotRegionCard}>
      <Text style={styles.hotIcon}>🔥</Text>
      <View style={styles.hotInfo}>
        <Text style={styles.hotTitle}>{prefecture.name}が熱い！</Text>
        <Text style={styles.hotSubtitle}>
          {prefecture.count.toLocaleString()}人が参加表明中
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hotRegionCard: {
    backgroundColor: palette.red500 + "26", // 15% opacity
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.red500 + "4D", // 30% opacity
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  hotIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  hotInfo: {
    flex: 1,
  },
  hotTitle: {
    color: color.danger,
    fontSize: 14,
    fontWeight: "bold",
  },
  hotSubtitle: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
