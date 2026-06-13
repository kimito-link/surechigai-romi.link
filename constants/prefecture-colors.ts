/**
 * Prefecture Colors
 * 都道府県カラーの定義
 * 
 * デフォルメ日本地図などで使用される都道府県別の色を定義
 */

import { palette } from "@/theme/tokens";

/**
 * 都道府県カラーマップ
 * デフォルメ日本地図で使用される色定義
 * 
 * Note: paletteに存在しない色は、近似的な色を使用
 */
export const PREFECTURE_COLORS = {
  // 北海道・東北（緑系）
  "北海道": "#90EE90", // LightGreen - paletteに近い色がないためハードコード
  "青森": "#87CEEB", // SkyBlue - paletteに近い色がないためハードコード
  "秋田": "#87CEEB",
  "岩手": "#87CEEB",
  "山形": "#87CEEB",
  "宮城": "#87CEEB",
  "福島": "#87CEEB",
  
  // 関東（青系）
  "茨城": "#87CEFA", // LightSkyBlue - paletteに近い色がないためハードコード
  "栃木": "#87CEFA",
  "群馬": "#87CEFA",
  "埼玉": "#87CEFA",
  "千葉": "#87CEFA",
  "東京": palette.blue600, // #4169E1
  "神奈川": "#87CEFA",
  
  // 中部（紫・ピンク系）
  "新潟": "#DDA0DD", // Plum - paletteに近い色がないためハードコード
  "富山": "#DDA0DD",
  "石川": "#DDA0DD",
  "福井": "#DDA0DD",
  "山梨": "#FFB6C1", // LightPink - paletteに近い色がないためハードコード
  "長野": "#DDA0DD",
  "岐阜": "#FFB6C1",
  "静岡": "#FFB6C1",
  "愛知": "#FFB6C1",
  
  // 近畿（ピンク系）
  "三重": "#FFB6C1",
  "滋賀": "#FFB6C1",
  "京都": "#FFB6C1",
  "大阪": palette.pink500, // #FF69B4
  "兵庫": "#FFB6C1",
  "奈良": "#FFB6C1",
  "和歌山": "#FFB6C1",
  
  // 中国（赤系）
  "鳥取": "#FFA07A", // LightSalmon - paletteに近い色がないためハードコード
  "島根": "#FFA07A",
  "岡山": "#FFA07A",
  "広島": "#FFA07A",
  "山口": "#FFA07A",
  
  // 四国（オレンジ系）
  "徳島": palette.gold, // #FFA500
  "香川": palette.gold,
  "愛媛": palette.gold,
  "高知": palette.gold,
  
  // 九州（黄色系）
  "福岡": "#FFD700", // Gold - palette.yellow400はパープルなのでハードコード
  "佐賀": "#FFD700",
  "長崎": "#FFD700",
  "熊本": "#FFD700",
  "大分": "#FFD700",
  "宮崎": "#FFD700",
  "鹿児島": "#FFD700",
  "沖縄": "#FFD700",
} as const;
