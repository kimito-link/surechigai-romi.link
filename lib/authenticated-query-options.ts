/**
 * ユーザー固有 tRPC クエリ共通オプション。
 * PC ブラウザで persist キャッシュが空のまま表示されるのを防ぐ。
 */
export const AUTHENTICATED_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: true,
  refetchOnReconnect: true,
} as const;
