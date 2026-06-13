/**
 * useHeatmapData - ヒートマップデータ処理フック
 * 
 * 単一責任: データの集計・変換ロジックのみ
 */

import { useMemo } from "react";
import { prefecturesData, prefectureNameToCode } from "@/lib/prefecture-paths";
import { REGION_GROUPS } from "./constants";
import { normalizePrefectureName } from "./utils";
import type { PrefectureCount, HotPrefecture } from "./types";

export function useHeatmapData(prefectureCounts: PrefectureCount) {
  // 都道府県ごとの参加者数を集計（コード別）
  const prefectureCounts47 = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.entries(prefectureCounts).forEach(([name, count]) => {
      const normalizedName = normalizePrefectureName(name);
      const code = prefectureNameToCode[normalizedName] || prefectureNameToCode[name];
      if (code) {
        counts[code] = (counts[code] || 0) + count;
      }
    });
    return counts;
  }, [prefectureCounts]);

  // 最大参加者数（都道府県）
  const maxPrefectureCount = useMemo(() => {
    return Math.max(...Object.values(prefectureCounts47), 0);
  }, [prefectureCounts47]);

  // 総参加者数
  const totalCount = useMemo(() => {
    return Object.values(prefectureCounts).reduce((sum, count) => sum + count, 0);
  }, [prefectureCounts]);

  // 地域ごとの参加者数を集計
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    REGION_GROUPS.forEach(region => {
      counts[region.name] = region.prefectures.reduce(
        (sum, pref) => sum + (prefectureCounts[pref] || 0), 
        0
      );
    });
    return counts;
  }, [prefectureCounts]);

  // 最大参加者数（地域）
  const maxRegionCount = useMemo(() => {
    return Math.max(...Object.values(regionCounts), 1);
  }, [regionCounts]);

  // 最も参加者が多い都道府県を特定
  const hotPrefecture = useMemo<HotPrefecture>(() => {
    let maxCount = 0;
    let hotCode = 0;
    Object.entries(prefectureCounts47).forEach(([code, count]) => {
      if (count > maxCount) {
        maxCount = count;
        hotCode = parseInt(code);
      }
    });
    const prefData = prefecturesData.find(p => p.code === hotCode);
    return { name: prefData?.name || "", count: maxCount };
  }, [prefectureCounts47]);

  // 参加者がいる都道府県の数
  const activePrefectureCount = useMemo(() => {
    return Object.values(prefectureCounts47).filter(c => c > 0).length;
  }, [prefectureCounts47]);

  return {
    prefectureCounts47,
    maxPrefectureCount,
    totalCount,
    regionCounts,
    maxRegionCount,
    hotPrefecture,
    activePrefectureCount,
  };
}
