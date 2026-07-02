/**
 * 認証直後から動く常駐シェル（lazy タブ chunk を待たない — 星野ロミ §9-8）。
 */
import { useAuth } from "@/hooks/use-auth";
import { LivePresenceRunner } from "@/components/presence/live-presence-runner";

export function AuthenticatedPresenceShell() {
  const { isAuthenticated, isAuthReady } = useAuth();
  if (!isAuthReady || !isAuthenticated) return null;

  return (
    <>
      <LivePresenceRunner />
    </>
  );
}
