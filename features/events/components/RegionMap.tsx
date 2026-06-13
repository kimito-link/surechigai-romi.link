/**
 * 地域別マップコンポーネント
 * 参加者の地域分布を表示
 */
import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { eventText, eventFont } from "@/features/events/ui/theme/tokens";
import { regionGroups, countByRegion, type RegionName } from "@/constants/prefectures";
import type { Participation } from "@/types/participation";

export interface RegionMapProps {
  /** 参加者リスト */
  participations: Participation[];
  /** 強調表示する都道府県（参加完了時のアニメーション用） */
  highlightPrefecture?: string;
}

/** 地域グループのViewModel */
export interface RegionGroupVM {
  name: string;
  count: number;
  prefectures: string[];
}

export function RegionMap({ participations, highlightPrefecture }: RegionMapProps) {
  const colors = useColors();
  
  // 地域ごとの参加者数を集計
  const regionCounts = countByRegion(participations);
  const maxCount = Math.max(...Object.values(regionCounts), 1);

  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
        地域別参加者
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {regionGroups.map((region) => {
          const count = regionCounts[region.name as RegionName] || 0;
          const intensity = count / maxCount;
          // 強調表示する都道府県がこの地域に含まれるかチェック
          const isHighlighted = highlightPrefecture && (region.prefectures as readonly string[]).includes(highlightPrefecture);

          return (
            <View
              key={region.name}
              style={{
                width: "48%",
                backgroundColor: isHighlighted ? "rgba(236, 72, 153, 0.2)" : "#1A1D21",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                borderWidth: isHighlighted ? 2 : 1,
                borderColor: isHighlighted ? "rgba(236, 72, 153, 1)" : (count > 0 ? `rgba(236, 72, 153, ${0.3 + intensity * 0.7})` : "#2D3139"),
              }}
            >
              <Text style={{ color: eventText.secondary, fontSize: eventFont.meta }}>{region.name}</Text>
              <Text style={{ color: count > 0 ? eventText.accent : eventText.hint, fontSize: 20, fontWeight: "bold" }}>
                {count}人
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
