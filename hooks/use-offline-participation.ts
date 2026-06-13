/**
 * オフライン参加フック（プレースホルダー）
 * すれちがいロミ: encounters/locations API 実装後に置き換える
 */
export function useOfflineParticipation() {
  return {
    submit: async () => {},
    isLoading: false,
    error: null,
  };
}
