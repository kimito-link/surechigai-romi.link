/**
 * ユーザー固有 tRPC クエリ共通オプション。
 * PC ブラウザで persist キャッシュが空のまま表示されるのを防ぐ。
 * staleTime 内はキャッシュを即表示し、裏で refetch（SWR 体感）。
 */
export const AUTHENTICATED_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchOnMount: true,
  refetchOnReconnect: true,
} as const;
