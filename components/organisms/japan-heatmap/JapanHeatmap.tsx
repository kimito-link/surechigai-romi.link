/**
 * JapanHeatmap - メインコンポーネント
 * 
 * 単一責任: サブコンポーネントの組み立てとレイアウトのみ
 * 
 * 分割されたサブコンポーネント:
 * - JapanMapSvg: 47都道府県の地図描画
 * - HeatmapLegend: 色の凡例
 * - StatsSummary: 統計数値の表示
 * - HotPrefectureCard: 最も参加者が多い都道府県
 * - RegionCardList: 地域カードの一覧
 * - HeatmapEmptyState: 参加者がいない場合の空状態
 * 
 * v6.25: エラーバウンダリを追加してSVG描画エラーをキャッチ
 */

import { View, Text, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { JapanMapSvg } from "./JapanMapSvg";
import { HeatmapLegend } from "./HeatmapLegend";
import { StatsSummary } from "./StatsSummary";
import { HotPrefectureCard } from "./HotPrefectureCard";
import { RegionCardList } from "./RegionCardList";
import { HeatmapEmptyState } from "./HeatmapEmptyState";
import { useHeatmapData } from "./useHeatmapData";
import type { JapanHeatmapProps } from "./types";

/**
 * JapanHeatmapInner - 内部コンポーネント（エラーバウンダリでラップされる）
 */
function JapanHeatmapInner({ 
  prefectureCounts, 
  onPrefecturePress, 
  onRegionPress 
}: JapanHeatmapProps) {
  const {
    prefectureCounts47,
    maxPrefectureCount,
    totalCount,
    regionCounts,
    maxRegionCount,
    hotPrefecture,
    activePrefectureCount,
  } = useHeatmapData(prefectureCounts);

  // 参加者がいない場合は空状態を表示
  if (totalCount === 0) {
    return <HeatmapEmptyState />;
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>🗾 地域別参加者マップ</Text>
        <Text style={styles.subtitle}>合計 {totalCount.toLocaleString()}人</Text>
      </View>

      {/* 日本地図（47都道府県） */}
      <JapanMapSvg
        prefectureCounts47={prefectureCounts47}
        maxPrefectureCount={maxPrefectureCount}
        onPrefecturePress={onPrefecturePress}
      />

      {/* 凡例 */}
      <HeatmapLegend />

      {/* 統計サマリー */}
      <StatsSummary
        activePrefectureCount={activePrefectureCount}
        totalCount={totalCount}
        maxPrefectureCount={maxPrefectureCount}
      />

      {/* ホットな都道府県のハイライト */}
      <HotPrefectureCard prefecture={hotPrefecture} />

      {/* 地域別詳細（カード形式） */}
      <RegionCardList
        prefectureCounts={prefectureCounts}
        regionCounts={regionCounts}
        maxRegionCount={maxRegionCount}
        onRegionPress={onRegionPress}
      />
    </View>
  );
}

/**
 * JapanHeatmap - エラーバウンダリでラップされたメインコンポーネント
 */
export function JapanHeatmap(props: JapanHeatmapProps) {
  return (
    <MapErrorBoundary mapType="heatmap" height={400}>
      <JapanHeatmapInner {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
});
