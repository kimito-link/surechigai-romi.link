import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import { shouldDeferTrpcOnGuestWeb } from "@/lib/clerk-public-routes";
import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";
import { AppBootstrapFallback } from "@/components/providers/app-bootstrap-fallback";

const PublicWebProvidersLazy = lazy(() =>
  import("@/components/providers/public-web-providers").then((m) => ({
    default: m.PublicWebProviders,
  })),
);

/**
 * Guest Web シェル用: `/` 初回 paint では tRPC/React Query を読まない。
 * 他タブへ移動したら即 load、トップに留まる場合は load 後に idle prefetch。
 */
export function GuestWebProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const deferTrpc = shouldDeferTrpcOnGuestWeb(pathname);
  const needsTrpcNow = !deferTrpc;
  const [trpcMounted, setTrpcMounted] = useState(false);

  useEffect(() => {
    if (needsTrpcNow) {
      setTrpcMounted(true);
      return;
    }
    return scheduleAfterWindowLoad(() => {
      setTrpcMounted(true);
    });
  }, [needsTrpcNow]);

  if (needsTrpcNow && !trpcMounted) {
    return <AppBootstrapFallback />;
  }

  if (!trpcMounted) {
    return <AppBootstrapFallback />;
  }

  return (
    <Suspense fallback={<AppBootstrapFallback />}>
      <PublicWebProvidersLazy>{children}</PublicWebProvidersLazy>
    </Suspense>
  );
}
