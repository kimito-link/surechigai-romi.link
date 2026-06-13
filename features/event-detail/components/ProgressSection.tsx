/**
 * ProgressSection Component
 * 目標達成状況の表示（進捗バー、地図、グラフ）
 */

import { View, Text, Pressable } from "react-native";
import { navigate } from "@/lib/navigation";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { JapanRegionBlocks } from "@/components/organisms/japan-region-blocks";
import { GrowthTrajectoryChart } from "@/components/organisms/growth-trajectory-chart";
import { TalkingCharacter, ACHIEVEMENT_MESSAGES } from "@/components/molecules/talking-character";
import { getMilestoneMessage } from "../constants";
import type { PrefectureCounts, SelectedRegion } from "../types";
import type { Participation } from "@/types/participation";

interface ProgressSectionProps {
  currentValue: number;
  goalValue: number;
  unit: string;
  progress: number;
  remaining: number;
  challengeId: number;
  prefectureCounts: PrefectureCounts;
  participations: Participation[] | undefined;
  myParticipation: Participation | null;
  onPrefecturePress: (prefName: string) => void;
  onRegionPress: (region: SelectedRegion) => void;
}

export function ProgressSection({
  currentValue,
  goalValue,
  unit,
  progress,
  remaining,
  challengeId,
  prefectureCounts,
  participations,
  myParticipation,
  onPrefecturePress,
  onRegionPress,
}: ProgressSectionProps) {
  const colors = useColors();
  
  
  // 成長軌跡データの生成
  const trajectoryData = (() => {
    if (!participations || participations.length === 0) return [];
    
    const dateMap = new Map<string, { count: number; milestone?: string }>();
    let cumulativeCount = 0;
    
    const sortedParticipations = [...participations].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    sortedParticipations.forEach((p) => {
      const dateKey = new Date(p.createdAt).toISOString().split('T')[0];
      cumulativeCount += p.contribution || 1;
      
      const milestone = getMilestoneMessage(cumulativeCount);
      dateMap.set(dateKey, { count: cumulativeCount, milestone });
    });
    
    return Array.from(dateMap.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      count: data.count,
      milestone: data.milestone,
    }));
  })();
  
  return (
    <View style={{ padding: 16 }}>
      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        {/* 達成状況 */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ color: color.textSecondary, fontSize: 14 }}>現在の達成状況（参加予定）</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={{ color: color.accentPrimary, fontSize: 48, fontWeight: "bold" }}>
              {currentValue}
            </Text>
            <Text style={{ color: color.textHint, fontSize: 20, marginLeft: 4 }}>
              / {goalValue}{unit}
            </Text>
          </View>
        </View>

        {/* 進捗バー */}
        <View
          style={{
            height: 12,
            backgroundColor: color.border,
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <LinearGradient
            colors={[color.accentPrimary, color.accentAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 6,
            }}
          />
        </View>
        
        {progress >= 100 ? (
          <View style={{ alignItems: "center" }}>
            <TalkingCharacter
              size={80}
              messages={ACHIEVEMENT_MESSAGES}
              bubblePosition="top"
            />
            <Pressable
              onPress={() => navigate.toAchievement(challengeId)}
              style={{
                backgroundColor: color.accentPrimary,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 24,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}>
                🎉 達成記念ページを見る
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: color.textSecondary, fontSize: 14, textAlign: "center" }}>
            あと<Text style={{ color: color.accentPrimary, fontWeight: "bold" }}>{remaining}{unit}</Text>で目標達成！
          </Text>
        )}

        {/* 地域別参加者マップ */}
        <JapanRegionBlocks 
          prefectureCounts={prefectureCounts} 
          onPrefecturePress={onPrefecturePress}
          onRegionPress={(regionName, prefectures) => onRegionPress({ name: regionName, prefectures })}
          userPrefecture={myParticipation?.prefecture || undefined}
        />

        {/* 動員までの軌跡グラフ */}
        <GrowthTrajectoryChart
          data={trajectoryData}
          targetCount={goalValue}
          title="動員までの軌跡"
        />
      </View>
    </View>
  );
}
