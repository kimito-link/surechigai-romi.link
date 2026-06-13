/**
 * ヒートマップ関連のユーティリティ関数
 */

/**
 * 参加者数に応じたアイコンを返す
 */
export function getParticipantIcon(count: number): string {
  if (count === 0) return "";
  if (count <= 5) return "🔥";
  if (count <= 20) return "🔥🔥";
  return "🔥🔥🔥";
}

/**
 * ヒートマップ色の段階（参加者数に応じて色の濃淡を変化）
 */
export type HeatLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 参加者数と最大値からヒートレベルを計算
 */
export function getHeatLevel(count: number, maxCount: number): HeatLevel {
  if (count === 0) return 0;
  if (maxCount === 0) return 1;
  
  const ratio = count / maxCount;
  if (ratio <= 0.2) return 1; // 少ない
  if (ratio <= 0.4) return 2; // やや少ない
  if (ratio <= 0.6) return 3; // 中程度
  if (ratio <= 0.8) return 4; // 多い
  return 5; // 最多
}

/**
 * ヒートレベルに応じた色の不透明度を返す
 */
export function getHeatOpacity(level: HeatLevel): number {
  switch (level) {
    case 0: return 0.3;  // グレー
    case 1: return 0.5;  // 薄い
    case 2: return 0.65; // やや薄い
    case 3: return 0.8;  // 中程度
    case 4: return 0.9;  // 濃い
    case 5: return 1.0;  // 最も濃い
  }
}

/**
 * ヒートレベルに応じたボーダー幅を返す
 */
export function getHeatBorderWidth(level: HeatLevel): number {
  switch (level) {
    case 0: return 1;
    case 1: return 2;
    case 2: return 2;
    case 3: return 3;
    case 4: return 3;
    case 5: return 4;
  }
}
