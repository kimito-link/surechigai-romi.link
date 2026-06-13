/**
 * JapanHeatmap - 型定義
 * 
 * 単一責任: 型定義のみ
 */

/** 都道府県ごとの参加者数 */
export interface PrefectureCount {
  [prefecture: string]: number;
}

/** JapanHeatmapのProps */
export interface JapanHeatmapProps {
  prefectureCounts: PrefectureCount;
  onPrefecturePress?: (prefectureName: string) => void;
  onRegionPress?: (regionName: string, prefectures: string[]) => void;
}

/** 地域グループ */
export interface RegionGroup {
  name: string;
  prefectures: string[];
}

/** ラベル位置 */
export interface LabelPosition {
  x: number;
  y: number;
}

/** ホットな都道府県情報 */
export interface HotPrefecture {
  name: string;
  count: number;
}

/** 地域カードのProps */
export interface RegionCardProps {
  region: RegionGroup;
  count: number;
  maxCount: number;
  isHot: boolean;
  onPress?: () => void;
}

/** 統計サマリーのProps */
export interface StatsSummaryProps {
  activePrefectureCount: number;
  totalCount: number;
  maxPrefectureCount: number;
}

/** ホット都道府県カードのProps */
export interface HotPrefectureCardProps {
  prefecture: HotPrefecture;
}

/** 凡例のProps */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LegendProps {
  // 現状Propsなし、将来の拡張用
}

/** 空状態のProps */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EmptyStateProps {
  // 現状Propsなし、将来の拡張用
}
