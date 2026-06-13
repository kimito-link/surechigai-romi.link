/**
 * 盛り上がりセクションコンポーネント
 * ホーム画面に表示される統計情報と地域ハイライト
 */
import { View, Text } from "react-native";
import { useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { homeUI, homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { regionGroups } from "@/constants/prefectures";
import type { Challenge } from "@/types/challenge";
import { homeCopy } from "@/constants/copy/home";

interface EngagementSectionProps {
  /** チャレンジデータの配列 */
  challenges: Challenge[];
}

export function EngagementSection({ challenges }: EngagementSectionProps) {
  const colors = useColors();
  
  // 統計を計算
  const stats = useMemo(() => {
    const totalParticipants = challenges.reduce((sum, c) => sum + c.currentValue, 0);
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => c.status === "active").length;
    
    // 地域別集計（仮のデータ - 実際はparticipantsから集計）
    const regionStats: Record<string, number> = {};
    Object.keys(regionGroups).forEach(region => {
      regionStats[region] = Math.floor(Math.random() * totalParticipants / 6);
    });
    
    // 最も盛り上がっている地域
    const hotRegion = Object.entries(regionStats).sort((a, b) => b[1] - a[1])[0];
    
    return { totalParticipants, totalChallenges, activeChallenges, regionStats, hotRegion };
  }, [challenges]);

  if (challenges.length === 0) return null;

  return (
    <View style={{ marginHorizontal: 16, marginVertical: 12 }}>
      {/* 統計カード */}
      <View style={{ 
        backgroundColor: homeUI.surface, 
        borderRadius: 16, 
        padding: 20,
        borderWidth: 1,
        borderColor: homeUI.border,
      }}>
        <Text style={{ color: homeText.accent, fontSize: homeFont.title, fontWeight: "bold", marginBottom: 16 }}>
          📊 みんなの盛り上がり
        </Text>
        
        {/* 統計数値 */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 32, fontWeight: "bold" }}>{stats.totalParticipants}</Text>
            <Text style={{ color: homeText.muted, fontSize: homeFont.meta }}>{homeCopy.engagement.totalParticipations}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 32, fontWeight: "bold" }}>{stats.activeChallenges}</Text>
            <Text style={{ color: homeText.muted, fontSize: homeFont.meta }}>開催中</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 32, fontWeight: "bold" }}>{stats.totalChallenges}</Text>
            <Text style={{ color: homeText.muted, fontSize: homeFont.meta }}>総チャレンジ</Text>
          </View>
        </View>

        {/* 地域ハイライト */}
        {stats.hotRegion && stats.hotRegion[1] > 0 && (
          <View style={{ 
            backgroundColor: homeUI.border, 
            borderRadius: 12, 
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🗾</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: homeUI.iconBgGold, fontSize: homeFont.body, fontWeight: "bold" }}>
                {stats.hotRegion[0]}が熱い！
              </Text>
              <Text style={{ color: homeText.muted, fontSize: homeFont.meta }}>
                {stats.hotRegion[1]}{homeCopy.engagement.hotRegion}
              </Text>
            </View>
            <MaterialIcons name="local-fire-department" size={24} color={homeUI.iconBgFire} />
          </View>
        )}
      </View>
    </View>
  );
}
