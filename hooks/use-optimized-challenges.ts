/**
 * 最適化されたデータフック（プレースホルダー）
 * すれちがいロミ: encounters/locations API 実装後に置き換える
 */
export function useOptimizedChallenges() {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
}
