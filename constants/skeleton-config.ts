/**
 * スケルトンローダーの設定
 * アニメーション速度を調整して体感速度を向上
 */

export const SKELETON_CONFIG = {
  // アニメーション速度（ミリ秒）
  // デフォルト: 1500ms → 800msに短縮
  animationDuration: 800,
  
  // フェードイン/アウトの速度（ミリ秒）
  fadeDuration: 200,
  
  // 最小表示時間（ミリ秒）
  // スケルトンが一瞬で消えるのを防ぐ
  minDisplayTime: 300,
  
  // 背景色の不透明度
  backgroundOpacity: 0.1,
  
  // ハイライト色の不透明度
  highlightOpacity: 0.2,
} as const;
