/**
 * チャレンジカードのカラーパレット
 * カードと詳細画面で同じ色を使用するための共有ユーティリティ
 */

export interface ChallengeColor {
  bg: string;
  gradient: [string, string];
}

// 「しゃべった！」風のカラフルなカラーパレット
export const CHALLENGE_COLORS: ChallengeColor[] = [
  { bg: "#EC4899", gradient: ["#EC4899", "#F472B6"] }, // ピンク
  { bg: "#EF4444", gradient: ["#EF4444", "#F87171"] }, // 赤
  { bg: "#F97316", gradient: ["#F97316", "#FB923C"] }, // オレンジ
  { bg: "#EAB308", gradient: ["#EAB308", "#FACC15"] }, // 黄色
  { bg: "#14B8A6", gradient: ["#14B8A6", "#2DD4BF"] }, // ティール
  { bg: "#22C55E", gradient: ["#22C55E", "#4ADE80"] }, // 緑
  { bg: "#8B5CF6", gradient: ["#8B5CF6", "#A78BFA"] }, // 紫
  { bg: "#3B82F6", gradient: ["#3B82F6", "#60A5FA"] }, // 青
];

/**
 * チャレンジIDに基づいて色を取得
 * 同じIDは常に同じ色を返す
 */
export function getChallengeColor(challengeId: number): ChallengeColor {
  const index = challengeId % CHALLENGE_COLORS.length;
  return CHALLENGE_COLORS[index];
}

/**
 * インデックスに基づいて色を取得（リスト表示用）
 */
export function getChallengeColorByIndex(index: number): ChallengeColor {
  return CHALLENGE_COLORS[index % CHALLENGE_COLORS.length];
}
