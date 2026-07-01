/**
 * ユーザー固有 tRPC クエリ共通オプション。
 * staleTime 内はキャッシュを即表示し、裏で refetch（SWR 体感）。
 */
export const AUTHENTICATED_QUERY_OPTIONS = {
  staleTime: 120_000,
  refetchOnMount: true,
  refetchOnReconnect: true,
} as const;

/** 初回取得のみ true — キャッシュがあればスピナーを出さない */
export function isInitialQueryLoad(isLoading: boolean, data: unknown): boolean {
  return isLoading && data == null;
}
