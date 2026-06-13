/**
 * RankingHeader Component
 * ランキング画面のヘッダー
 */

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";
import type { RankingTabType } from "../types";

interface RankingHeaderProps {
  tab: RankingTabType;
}

export function RankingHeader({ tab }: RankingHeaderProps) {
  return (
    <>
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: color.border,
      }}>
        <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold" }}>
          ランキング
        </Text>
        <Text style={{ color: color.textSecondary, fontSize: 12, marginTop: 4 }}>
          チャレンジへの参加・貢献でポイントを獲得して上位を目指そう
        </Text>
      </View>

      {/* タブ説明 */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={{ color: color.textSubtle, fontSize: 12 }}>
          {tab === "contribution" 
            ? "貢献度: チャレンジへの参加・同伴・拡散で獲得したポイントのランキング"
            : "主催者: チャレンジを作成した人の総参加予定数ランキング"}
        </Text>
      </View>
    </>
  );
}
