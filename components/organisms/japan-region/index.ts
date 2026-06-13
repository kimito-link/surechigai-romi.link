// 地域データ
export { regions, allPrefectures, findRegionByPrefecture, findRegionById } from "./region-data";
export type { Region, Prefecture } from "./region-data";

// ヒートマップユーティリティ
export { getParticipantIcon, getHeatLevel, getHeatOpacity, getHeatBorderWidth } from "./heat-utils";
export type { HeatLevel } from "./heat-utils";

// メインコンポーネント
export { JapanRegionBlocks } from "./JapanRegionBlocks";
export type { JapanRegionBlocksProps } from "./JapanRegionBlocks";

