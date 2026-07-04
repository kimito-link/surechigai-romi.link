/**
 * 居場所のリアルタイム公開（レーダー）。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { trpc } from "@/lib/trpc";
import {
  LIVE_PRESENCE_MIN_PULSE_GAP_MS,
  LIVE_PRESENCE_PULSE_INTERVAL_MS,
} from "@/modules/encounter/core/live-presence";
import type { CurrentLocation } from "@/lib/get-current-location";
import { startWebLiveLocationSession, type LiveLocationSession } from "@/lib/live-location-session";
import { readLocationOptInSync } from "@/lib/location-opt-in";
import {
  readLivePresenceUserOffSync,
  readOptimisticLivePresenceDesired,
  saveLivePresenceUserOff,
  setOptimisticLivePresenceDesired,
  subscribeOptimisticLivePresenceDesired,
} from "@/lib/live-presence-user-prefs";

type PulseInput = {
  lat: number;
  lng: number;
  accuracy?: number;
};

async function readNativeLocation(): Promise<CurrentLocation> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Location = (await import("expo-location")) as any;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy?.Balanced ?? 4,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

/** マイページ等: ON/OFF トグル用 */
export function useLivePresenceControls() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery();
  const setEnabledMutation = trpc.presence.setEnabled.useMutation({
    onSuccess: () => utils.settings.invalidate(),
  });

  const [liveEnabled, setLiveEnabled] = useState(false);

  useEffect(() => {
    if (settingsQuery.data) {
      setLiveEnabled(settingsQuery.data.livePresenceEnabled ?? false);
    }
  }, [settingsQuery.data]);

  const toggleLivePresence = useCallback(
    (next: boolean) => {
      const prev = liveEnabled;
      setLiveEnabled(next);
      if (next) {
        void saveLivePresenceUserOff(false);
        setOptimisticLivePresenceDesired(true);
      } else {
        void saveLivePresenceUserOff(true);
        setOptimisticLivePresenceDesired(false);
      }
      setEnabledMutation.mutate(
        { enabled: next },
        {
          onError: () => {
            setLiveEnabled(prev);
            setOptimisticLivePresenceDesired(prev);
          },
        },
      );
    },
    [liveEnabled, setEnabledMutation],
  );

  const isPausing =
    settingsQuery.data?.locationPausedUntil != null &&
    new Date(settingsQuery.data.locationPausedUntil).getTime() > Date.now();

  return {
    liveEnabled,
    toggleLivePresence,
    isPausing,
    isLoading: settingsQuery.isLoading || setEnabledMutation.isPending,
  };
}

function useEffectiveLivePresenceEnabled(serverEnabled: boolean): boolean {
  const [optimistic, setOptimistic] = useState(readOptimisticLivePresenceDesired);

  useEffect(() => subscribeOptimisticLivePresenceDesired(() => {
    setOptimistic(readOptimisticLivePresenceDesired());
  }), []);

  if (readLivePresenceUserOffSync()) return false;
  if (serverEnabled) return true;
  if (optimistic) return true;
  if (readLocationOptInSync() && !readLivePresenceUserOffSync()) return true;
  return false;
}

/** タブ内バックグラウンド: ON 中に watch + pulse */
export function useLivePresenceSync(options?: { enabled?: boolean }) {
  const shouldRun = options?.enabled ?? true;
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: shouldRun,
  });
  const pulseMutation = trpc.presence.pulse.useMutation();

  const serverEnabled = settingsQuery.data?.livePresenceEnabled ?? false;
  const liveEnabled = useEffectiveLivePresenceEnabled(serverEnabled);
  const liveEnabledRef = useRef(false);
  const webSessionRef = useRef<LiveLocationSession | null>(null);
  const nativeWatchRef = useRef<{ remove: () => void } | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPulseAtRef = useRef(0);
  const allowImmediatePulseRef = useRef(true);

  useEffect(() => {
    liveEnabledRef.current = liveEnabled;
  }, [liveEnabled]);

  // 依存は安定参照のみにする（2026-07-04 障害対応）:
  // `pulseMutation` オブジェクトはレンダー毎に新しい参照になるため、これを依存に入れると
  // 「pulse送信 → mutation状態変化で再レンダー → sendPulse/startWatching 再生成 →
  // effect 再実行で watch 再起動＝即時pulse許可リセット → 即pulse送信 → …」の
  // 無限ループになる（実測: presence.pulse が数秒で1000リクエスト・全429）。
  // mutateAsync は React Query が安定参照を保証している。
  const pulseMutateAsync = pulseMutation.mutateAsync;
  const sendPulse = useCallback(
    async (loc: PulseInput) => {
      if (!liveEnabledRef.current) return;
      const now = Date.now();
      const immediate = allowImmediatePulseRef.current;
      if (!immediate && now - lastPulseAtRef.current < LIVE_PRESENCE_MIN_PULSE_GAP_MS) {
        return;
      }
      allowImmediatePulseRef.current = false;
      lastPulseAtRef.current = now;
      try {
        await pulseMutateAsync({
          lat: loc.lat,
          lng: loc.lng,
          accuracy: loc.accuracy,
        });
        utils.presence.list.invalidate();
      } catch {
        // 次回 pulse に任せる（lastPulseAtRef は送信前に更新済みなので
        // 失敗時も MIN_PULSE_GAP のクールダウンが効く）
      }
    },
    [pulseMutateAsync, utils],
  );

  const stopWatching = useCallback(() => {
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    webSessionRef.current?.stop();
    webSessionRef.current = null;
    nativeWatchRef.current?.remove();
    nativeWatchRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    stopWatching();
    if (!liveEnabledRef.current) return;

    allowImmediatePulseRef.current = true;
    lastPulseAtRef.current = 0;

    const onLocation = (loc: CurrentLocation) => {
      void sendPulse(loc);
    };

    if (Platform.OS === "web") {
      webSessionRef.current = startWebLiveLocationSession(onLocation);
      pulseTimerRef.current = setInterval(() => {
        if (!liveEnabledRef.current) return;
        webSessionRef.current?.refreshNow();
      }, LIVE_PRESENCE_PULSE_INTERVAL_MS);
      return;
    }

    try {
      const initial = await readNativeLocation();
      await sendPulse(initial);
    } catch {
      // watch に任せる
    }

    pulseTimerRef.current = setInterval(() => {
      if (!liveEnabledRef.current) return;
      readNativeLocation()
        .then((loc) => sendPulse(loc))
        .catch(() => {});
    }, LIVE_PRESENCE_PULSE_INTERVAL_MS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Location = (await import("expo-location")) as any;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    nativeWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy?.Balanced ?? 4,
        timeInterval: LIVE_PRESENCE_PULSE_INTERVAL_MS,
        distanceInterval: 30,
      },
      (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => {
        void sendPulse({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
    );
  }, [sendPulse, stopWatching]);

  useEffect(() => {
    if (!shouldRun || !liveEnabled) {
      stopWatching();
      return;
    }
    void startWatching();
    return stopWatching;
  }, [shouldRun, liveEnabled, startWatching, stopWatching]);

  useEffect(() => {
    if (!shouldRun) return;
    const onAppState = (state: AppStateStatus) => {
      if (state === "active" && liveEnabledRef.current) {
        void startWatching();
      } else if (state !== "active") {
        stopWatching();
      }
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [shouldRun, startWatching, stopWatching]);
}
