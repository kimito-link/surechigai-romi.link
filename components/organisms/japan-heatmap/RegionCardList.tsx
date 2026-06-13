/**
 * RegionCardList - 地域カードリスト
 * 
 * 単一責任: 地域カードの一覧表示のみ
 */

import { View, StyleSheet } from "react-native";
import { RegionCard } from "./RegionCard";
import { REGION_GROUPS } from "./constants";
import type { PrefectureCount } from "./types";

interface RegionCardListProps {
  prefectureCounts: PrefectureCount;
  regionCounts: Record<string, number>;
  maxRegionCount: number;
  onRegionPress?: (regionName: string, prefectures: string[]) => void;
}

export function RegionCardList({ 
  prefectureCounts,
  regionCounts, 
  maxRegionCount, 
  onRegionPress 
}: RegionCardListProps) {
  // 最もホットな地域を特定
  const hottestRegion = REGION_GROUPS.find(
    r => regionCounts[r.name] === maxRegionCount && regionCounts[r.name] > 0
  );

  return (
    <View style={styles.regionCards}>
      {REGION_GROUPS.map((region) => {
        const count = regionCounts[region.name] || 0;
        const isHot = region.name === hottestRegion?.name;

        return (
          <RegionCard
            key={region.name}
            region={region}
            count={count}
            maxCount={maxRegionCount}
            isHot={isHot}
            onPress={onRegionPress ? () => onRegionPress(region.name, region.prefectures) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  regionCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
