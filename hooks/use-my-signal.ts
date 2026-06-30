import { trpc } from "@/lib/trpc";
import { AUTHENTICATED_QUERY_OPTIONS } from "@/lib/authenticated-query-options";
import { useAuth } from "@/hooks/use-auth";

/** マイページ・コンテキストバー・タブバッジ共通のサマリークエリ */
export function useMySignal() {
  const { isAuthenticated } = useAuth();
  return trpc.dashboard.mySignal.useQuery(undefined, {
    ...AUTHENTICATED_QUERY_OPTIONS,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
}
