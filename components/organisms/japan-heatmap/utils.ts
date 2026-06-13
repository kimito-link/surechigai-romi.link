/**
 * JapanHeatmap - ユーティリティ関数
 * 
 * 単一責任: データ変換・計算ロジックのみ
 */

import { color } from "@/theme/tokens";

/**
 * 参加者数に応じたヒートマップの色を取得
 * 黄色(少) → オレンジ → 赤 → 濃い赤(多)
 */
export function getHeatColor(count: number, maxCount: number): string {
  if (count === 0) {
    return color.heatmapNone;
  }
  
  const ratio = maxCount > 0 ? count / maxCount : 0;
  
  if (ratio <= 0.15) return color.heatmapLevel1;
  if (ratio <= 0.25) return color.heatmapLevel2;
  if (ratio <= 0.35) return color.heatmapLevel3;
  if (ratio <= 0.50) return color.heatmapLevel4;
  if (ratio <= 0.65) return color.heatmapLevel5;
  if (ratio <= 0.80) return color.heatmapLevel6;
  return color.heatmapLevel7;
}

/**
 * 都道府県名を正規化（「県」「府」「都」「道」を追加）
 */
export function normalizePrefectureName(name: string): string {
  if (!name) return "";
  if (name.endsWith("県") || name.endsWith("府") || name.endsWith("都") || name.endsWith("道")) {
    return name;
  }
  if (name === "北海道") return "北海道";
  if (name === "東京") return "東京都";
  if (name === "大阪") return "大阪府";
  if (name === "京都") return "京都府";
  return name + "県";
}

/**
 * 都道府県名を短縮形に変換（地図上表示用）
 */
export function getShortPrefectureName(name: string): string {
  if (name === "北海道") return "北海道";
  if (name.endsWith("県")) return name.slice(0, -1);
  if (name.endsWith("府")) return name.slice(0, -1);
  if (name.endsWith("都")) return name.slice(0, -1);
  return name;
}

/**
 * 参加者数に応じた動的アイコンを取得
 */
export function getDynamicIcon(count: number): string {
  if (count === 0) return "😢";
  if (count <= 5) return "😊";
  if (count <= 20) return "🔥";
  return "🎉";
}
