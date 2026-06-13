/**
 * TopThreeRanking - トップ3ランキング
 * 
 * 単一責任: トップ3のコンパクト表示のみ
 */

import { View, StyleSheet } from "react-native";
import { TopThreeItem } from "./TopThreeItem";
import { useTopThreeData } from "./useRankingData";
import type { TopThreeRankingProps } from "./types";

export function TopThreeRanking({ participants }: TopThreeRankingProps) {
  const topThree = useTopThreeData(participants);

  if (topThree.length === 0) {
    return null;
  }

  return (
    <View style={styles.topThreeContainer}>
      {topThree[1] && (
        <TopThreeItem participant={topThree[1]} rank={2} />
      )}

      {topThree[0] && (
        <TopThreeItem participant={topThree[0]} rank={1} isFirst />
      )}

      {topThree[2] && (
        <TopThreeItem participant={topThree[2]} rank={3} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topThreeContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
});
