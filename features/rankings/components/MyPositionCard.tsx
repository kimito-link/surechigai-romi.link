/**
 * MyPositionCard Component
 * 自分の順位カード
 */

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";
import type { MyPosition } from "../types";

interface MyPositionCardProps {
  myPosition: MyPosition;
}

export function MyPositionCard({ myPosition }: MyPositionCardProps) {
  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: color.hostAccentLegacy,
    }}>
      <Text style={{ color: color.textMuted, fontSize: 12, marginBottom: 4 }}>
        あなたの順位
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: color.hostAccentLegacy, fontSize: 32, fontWeight: "bold" }}>
            {myPosition.position || "-"}
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 4 }}>位</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: color.accentPrimary, fontSize: 20, fontWeight: "bold" }}>
            {myPosition.totalContribution?.toLocaleString() || 0}
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 12 }}>貢献度</Text>
        </View>
      </View>
    </View>
  );
}
