/**
 * RankingEmptyState Component
 * ランキングが空の場合の状態
 */

import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";

export function RankingEmptyState() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <MaterialIcons name="leaderboard" size={64} color={color.textSubtle} />
      <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>
        まだランキングデータがありません
      </Text>
      <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center" }}>
        チャレンジに参加して貢献度を上げましょう
      </Text>
    </View>
  );
}
