/**
 * 位置オプトイン済み — サーバー settings 応答を待たず居場所 ON（星野ロミ型常駐）。
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { readLocationOptIn, readLocationOptInSync } from "@/lib/location-opt-in";
import { detectInstalledWebShell, shouldAutoStartLocation } from "@/lib/location-start-policy";
import { warmGeolocationCache } from "@/lib/geolocation-warmup";
import {
  readLivePresenceUserOffSync,
  saveLivePresenceUserOff,
  setOptimisticLivePresenceDesired,
} from "@/lib/live-presence-user-prefs";

export function useAutoStartLivePresence() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated && isAuthReady,
  });
  const setEnabledMutation = trpc.presence.setEnabled.useMutation({
    onMutate: async ({ enabled }) => {
      await utils.settings.get.cancel();
      const prev = utils.settings.get.getData();
      if (prev) {
        utils.settings.get.setData(undefined, { ...prev, livePresenceEnabled: enabled });
      }
      if (enabled) setOptimisticLivePresenceDesired(true);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) utils.settings.get.setData(undefined, ctx.prev);
      setOptimisticLivePresenceDesired(false);
    },
    onSettled: () => {
      void utils.settings.invalidate();
    },
  });
  const startedRef = useRef(false);

  const armLivePresence = () => {
    if (startedRef.current || readLivePresenceUserOffSync()) return;
    startedRef.current = true;
    setOptimisticLivePresenceDesired(true);
    warmGeolocationCache();
    void saveLivePresenceUserOff(false);
    setEnabledMutation.mutate({ enabled: true });
  };

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    if (settingsQuery.data?.livePresenceEnabled) {
      setOptimisticLivePresenceDesired(true);
      startedRef.current = true;
      warmGeolocationCache();
      return;
    }

    if (readLivePresenceUserOffSync()) return;

    const installedShell = detectInstalledWebShell();
    const syncOptIn = readLocationOptInSync();

    if (syncOptIn || installedShell) {
      armLivePresence();
    }

    void readLocationOptIn().then((locationOptIn) => {
      if (
        shouldAutoStartLocation({
          locationOptIn,
          installedShell,
        })
      ) {
        armLivePresence();
      }
    });
  }, [
    isAuthReady,
    isAuthenticated,
    settingsQuery.data?.livePresenceEnabled,
    setEnabledMutation,
  ]);
}
