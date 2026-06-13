/**
 * ParticipantRanking - 定数
 * 
 * 単一責任: 静的データの定義のみ
 */

import { color, palette } from "@/theme/tokens";

/** ランキングバッジの色 */
export const RANK_COLORS = {
  1: { bg: color.rankGold, text: palette.black, gradient: [color.rankGold, palette.gold] as const },
  2: { bg: color.rankSilver, text: palette.black, gradient: [palette.gray200, color.rankSilver] as const },
  3: { bg: color.rankBronze, text: color.textWhite, gradient: [color.rankBronze, palette.bronze] as const },
} as const;

/** ランキングバッジのアイコン */
export const RANK_ICONS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
} as const;

/** 性別による背景色 */
export const GENDER_COLORS = {
  male: { bg: palette.blue500 + "26", border: palette.blue500 }, // 15% opacity
  female: { bg: palette.pink500 + "26", border: palette.pink500 }, // 15% opacity
  unspecified: { bg: "transparent", border: "transparent" },
} as const;

/** デフォルト表示件数 */
export const DEFAULT_MAX_DISPLAY = 10;

/** デフォルトタイトル */
export const DEFAULT_TITLE = "貢献ランキング";
