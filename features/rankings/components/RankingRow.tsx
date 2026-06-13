/**
 * RankingRow Component
 * ランキングの1行を表示
 */

import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import type { RankingItem, ContributionRankingItem, HostRankingItem, RankingTabType } from "../types";

interface RankingRowProps {
  item: RankingItem;
  index: number;
  tab: RankingTabType;
}

export function RankingRow({ item, index, tab }: RankingRowProps) {
  const contributionItem = item as ContributionRankingItem;
  const hostItem = item as HostRankingItem;
  
  const userImage = contributionItem.userImage || hostItem.hostProfileImage;
  const userName = contributionItem.userName || hostItem.hostName || "匿名";
  const value = tab === "contribution" 
    ? contributionItem.totalContribution 
    : hostItem.totalParticipants;
  const label = tab === "contribution" ? "貢献度" : "総参加予定数（現時点）";

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: color.border,
    }}>
      {/* 順位 */}
      <View style={{ width: 40, alignItems: "center" }}>
        {index < 3 ? (
          <LinearGradient
            colors={index === 0 ? [color.rankGold, color.rankGold] : index === 1 ? [color.rankSilver, color.rankSilver] : [color.rankBronze, color.rankBronze]}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
              {index + 1}
            </Text>
          </LinearGradient>
        ) : (
          <Text style={{ color: color.textMuted, fontSize: 16, fontWeight: "bold" }}>
            {index + 1}
          </Text>
        )}
      </View>
      
      {/* プロフィール */}
      {userImage ? (
        <Image
          source={{ uri: userImage }}
          style={{ width: 48, height: 48, borderRadius: 24, marginLeft: 8 }}
        />
      ) : (
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          marginLeft: 8,
          backgroundColor: color.accentPrimary,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold" }}>
            {userName[0]}
          </Text>
        </View>
      )}
      
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>
          {userName}
        </Text>
        {tab === "hosts" && (
          <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
            {contributionItem.participationCount || 0} 回参加
          </Text>
        )}
      </View>
      
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: color.accentPrimary, fontSize: 18, fontWeight: "bold" }}>
          {(value || 0).toLocaleString()}
        </Text>
        <Text style={{ color: color.textMuted, fontSize: 12 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
