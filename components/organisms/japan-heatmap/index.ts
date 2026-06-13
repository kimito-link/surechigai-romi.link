/**
 * JapanHeatmap - 統一エクスポート
 * 
 * 分割されたコンポーネント群を統一エクスポート
 */

// メインコンポーネント
export { JapanHeatmap } from "./JapanHeatmap";

// サブコンポーネント（必要に応じて個別利用可能）
export { JapanMapSvg } from "./JapanMapSvg";
export { HeatmapLegend } from "./HeatmapLegend";
export { StatsSummary } from "./StatsSummary";
export { HotPrefectureCard } from "./HotPrefectureCard";
export { RegionCard } from "./RegionCard";
export { RegionCardList } from "./RegionCardList";
export { HeatmapEmptyState } from "./HeatmapEmptyState";

// フック
export { useHeatmapData } from "./useHeatmapData";

// ユーティリティ
export { getHeatColor, normalizePrefectureName, getShortPrefectureName, getDynamicIcon } from "./utils";

// 定数
export { REGION_GROUPS, PREFECTURE_LABEL_POSITIONS, MAP_CONFIG } from "./constants";

// 型
export type {
  PrefectureCount,
  JapanHeatmapProps,
  RegionGroup,
  LabelPosition,
  HotPrefecture,
  RegionCardProps,
  StatsSummaryProps,
  HotPrefectureCardProps,
} from "./types";
