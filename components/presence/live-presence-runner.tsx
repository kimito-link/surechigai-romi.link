/**
 * 居場所 ON 中の位置送信をバックグラウンドで維持する（UI なし）。
 */
import { useAuth } from "@/hooks/use-auth";
import { useLivePresenceSync } from "@/hooks/use-live-presence";

export function LivePresenceRunner() {
  const { isAuthenticated } = useAuth();
  useLivePresenceSync({ enabled: isAuthenticated });
  return null;
}
