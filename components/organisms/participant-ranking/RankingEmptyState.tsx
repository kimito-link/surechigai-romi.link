/**
 * RankingEmptyState - 空状態
 * 
 * 単一責任: 参加者がいない場合の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import type { RankingEmptyStateProps } from "./types";

export function RankingEmptyState({ title }: RankingEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.emptyState}>
        <MaterialIcons name="emoji-events" size={48} color={color.textSubtle} />
        <Text style={styles.emptyText}>まだ参加者がいません</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    color: color.textSubtle,
    fontSize: 14,
  },
});
