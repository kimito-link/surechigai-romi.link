/**
 * オフラインチャレンジフック（プレースホルダー）
 * すれちがいロミ: encounters/locations API 実装後に置き換える
 */
export function useOfflineChallenge(_challengeId?: number) {
  return {
    challenge: null,
    isLoading: false,
    error: null,
  };
}
