/**
 * MoreIndicator - もっと見るインジケーター
 * 
 * 単一責任: 残り参加者数の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import type { MoreIndicatorProps } from "./types";

export function MoreIndicator({ remainingCount }: MoreIndicatorProps) {
  if (remainingCount <= 0) {
    return null;
  }

  return (
    <View style={styles.moreIndicator}>
      <Text style={styles.moreText}>他 {remainingCount}人の参加者</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  moreIndicator: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.border,
    marginTop: 8,
  },
  moreText: {
    color: color.textSubtle,
    fontSize: 13,
  },
});
