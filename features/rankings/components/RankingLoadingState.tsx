/**
 * RankingLoadingState Component
 * ランキングのローディング状態
 */

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";

export function RankingLoadingState() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: color.textMuted }}>読み込み中...</Text>
    </View>
  );
}
