import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { TabPrefetchProvider } from "@/hooks/use-tab-prefetch";

/**
 * 公開 Web ルート用の軽量 Provider（Clerk SDK 非ロード）。
 * publicProcedure の tRPC のみ利用する画面向け。
 */
export function PublicWebProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60_000,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TabPrefetchProvider>{children}</TabPrefetchProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
