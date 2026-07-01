import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import { shouldDeferTrpcOnGuestWeb } from "@/lib/clerk-public-routes";
import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";
import { PublicWebProviders } from "@/components/providers/public-web-providers";

/**
 * Guest Web シェル用: `/` 初回 paint では tRPC/React Query を読まない。
 * 他タブへ移動したら即 mount。トップに留まる場合は idle prefetch。
 * children（タブ shell 含む）は常にアンマウントしない。
 */
export function GuestWebProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const deferTrpc = shouldDeferTrpcOnGuestWeb(pathname);
  const [idleTrpcReady, setIdleTrpcReady] = useState(false);

  useEffect(() => {
    if (!deferTrpc) return;
    return scheduleAfterWindowLoad(() => {
      setIdleTrpcReady(true);
    });
  }, [deferTrpc]);

  const trpcReady = !deferTrpc || idleTrpcReady;

  if (!trpcReady) {
    return <>{children}</>;
  }

  return <PublicWebProviders>{children}</PublicWebProviders>;
}
