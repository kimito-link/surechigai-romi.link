/**
 * RankingTabs Component
 * ランキングのタブ切り替え
 */

import { View, Text, Pressable } from "react-native";
import { color } from "@/theme/tokens";
import type { RankingTabType } from "../types";

interface RankingTabsProps {
  tab: RankingTabType;
  onTabChange: (tab: RankingTabType) => void;
}

export function RankingTabs({ tab, onTabChange }: RankingTabsProps) {
  return (
    <View style={{ 
      flexDirection: "row", 
      paddingHorizontal: 16, 
      paddingVertical: 12,
      gap: 8,
    }}>
      <Pressable
        onPress={() => onTabChange("contribution")}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: tab === "contribution" ? color.hostAccentLegacy : color.surface,
          alignItems: "center",
        }}
      >
        <Text style={{ color: color.textWhite, fontWeight: tab === "contribution" ? "bold" : "normal" }}>
          貢献度
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onTabChange("hosts")}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: tab === "hosts" ? color.hostAccentLegacy : color.surface,
          alignItems: "center",
        }}
      >
        <Text style={{ color: color.textWhite, fontWeight: tab === "hosts" ? "bold" : "normal" }}>
          主催者
        </Text>
      </Pressable>
    </View>
  );
}
