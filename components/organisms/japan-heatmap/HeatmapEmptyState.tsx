/**
 * HeatmapEmptyState - 参加者がいない場合の空状態
 * 
 * 単一責任: 空状態の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";

export function HeatmapEmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗾 地域別参加者マップ</Text>
        <Text style={styles.subtitle}>合計 0人</Text>
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🗾</Text>
        <Text style={styles.emptyText}>
          まだ参加者がいません{"\n"}最初の参加者になろう！
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
