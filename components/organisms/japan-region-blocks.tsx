/**
 * japan-region-blocks.tsx
 * 
 * このファイルは後方互換性のために維持されています。
 * 実際の実装は japan-region/ ディレクトリに分割されました。
 * 
 * 分割されたモジュール:
 * - region-data.ts: 地域・都道府県データと型定義
 * - heat-utils.ts: ヒートマップ関連のユーティリティ関数
 * - styles.ts: StyleSheet定義
 * - JapanRegionBlocks.tsx: メインコンポーネント
 */

// 新しいモジュールから再エクスポート
export { JapanRegionBlocks } from "./japan-region";
export type { JapanRegionBlocksProps } from "./japan-region";

// 地域データも必要に応じてエクスポート
export { regions, allPrefectures, findRegionByPrefecture, findRegionById } from "./japan-region";
export type { Region, Prefecture } from "./japan-region";

// ヒートマップユーティリティ
export { getParticipantIcon, getHeatLevel, getHeatOpacity, getHeatBorderWidth } from "./japan-region";
export type { HeatLevel } from "./japan-region";
