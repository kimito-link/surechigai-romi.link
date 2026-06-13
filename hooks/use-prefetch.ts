/**
 * プリフェッチフック
 * すれちがいロミ: 将来的に encounters/locations エンドポイントを追加予定
 */

/**
 * ホーム画面のデータをプリフェッチ（プレースホルダー）
 */
export function usePrefetchHome() {
  const prefetch = async () => {
    // TODO: encounters, locations API が実装されたらプリフェッチを追加
  };
  return { prefetch };
}
