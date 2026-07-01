/**
 * 位置オプトイン済みユーザー — 再訪問時に居場所をすぐ ON（fujisan の自動 requestLocation 相当）。
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { readLocationOptIn, readLocationOptInSync } from "@/lib/location-opt-in";
import { detectInstalledWebShell, shouldAutoStartLocation } from "@/lib/location-start-policy";
import { getCurrentLocation } from "@/lib/get-current-location";

export function useAutoStartLivePresence() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated && isAuthReady,
  });
  const setEnabledMutation = trpc.presence.setEnabled.useMutation({
    onSuccess: () => utils.settings.invalidate(),
  });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || startedRef.current) return;
    if (settingsQuery.isLoading || !settingsQuery.data) return;

    const settings = settingsQuery.data;
    if (settings.livePresenceEnabled) {
      startedRef.current = true;
      return;
    }

    const installedShell = detectInstalledWebShell();
    const syncOptIn = readLocationOptInSync();

    void (async () => {
      const locationOptIn = syncOptIn || (await readLocationOptIn());
      if (
        !shouldAutoStartLocation({
          locationOptIn,
          installedShell,
        })
      ) {
        return;
      }

      if (
        settings.locationPausedUntil &&
        new Date(settings.locationPausedUntil).getTime() > Date.now()
      ) {
        return;
      }

      startedRef.current = true;

      try {
        await getCurrentLocation();
      } catch {
        // 許可ダイアログは別導線に任せる
      }

      setEnabledMutation.mutate({ enabled: true });
    })();
  }, [
    isAuthReady,
    isAuthenticated,
    settingsQuery.data,
    settingsQuery.isLoading,
    setEnabledMutation,
  ]);
}
