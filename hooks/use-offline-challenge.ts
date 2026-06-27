/**
 * オフラインチャレンジフック（プレースホルダー）
 * 君斗りんくのすれ違ひ通信: encounters/locations API 実装後に置き換える
 */
export function useOfflineChallenge(_challengeId?: number) {
  return {
    challenge: null,
    isLoading: false,
    error: null,
  };
}
