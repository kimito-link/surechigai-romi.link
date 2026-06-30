/**
 * 居場所のリアルタイム公開（レーダー）。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { trpc } from "@/lib/trpc";
import { LIVE_PRESENCE_PULSE_INTERVAL_MS } from "@/modules/encounter/core/live-presence";
import type { CurrentLocation } from "@/lib/get-current-location";

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

function readWebLocation(): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("位置情報を取得できません"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 },
    );
  });
}

async function readCurrentLocation(): Promise<CurrentLocation> {
  if (Platform.OS === "web") return readWebLocation();
  return readNativeLocation();
}

/** マイページ等: ON/OFF トグル用（位置送信はしない） */
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
      setEnabledMutation.mutate(
        { enabled: next },
        { onError: () => setLiveEnabled(prev) },
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

/** タブ内バックグラウンド: ON 中に watch + pulse */
export function useLivePresenceSync(options?: { enabled?: boolean }) {
  const shouldRun = options?.enabled ?? true;
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: shouldRun,
  });
  const pulseMutation = trpc.presence.pulse.useMutation();

  const liveEnabled = settingsQuery.data?.livePresenceEnabled ?? false;
  const liveEnabledRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const nativeWatchRef = useRef<{ remove: () => void } | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPulseAtRef = useRef(0);

  useEffect(() => {
    liveEnabledRef.current = liveEnabled;
  }, [liveEnabled]);

  const sendPulse = useCallback(
    async (loc: PulseInput) => {
      if (!liveEnabledRef.current) return;
      const now = Date.now();
      if (now - lastPulseAtRef.current < 20_000) return;
      lastPulseAtRef.current = now;
      try {
        await pulseMutation.mutateAsync({
          lat: loc.lat,
          lng: loc.lng,
          accuracy: loc.accuracy,
        });
        utils.presence.list.invalidate();
      } catch {
        // 次回 pulse に任せる
      }
    },
    [pulseMutation, utils.presence.list],
  );

  const stopWatching = useCallback(() => {
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    if (Platform.OS === "web") {
      if (watchIdRef.current != null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    nativeWatchRef.current?.remove();
    nativeWatchRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    stopWatching();
    if (!liveEnabledRef.current) return;

    try {
      const initial = await readCurrentLocation();
      await sendPulse(initial);
    } catch {
      // watch / interval に任せる
    }

    pulseTimerRef.current = setInterval(() => {
      if (!liveEnabledRef.current) return;
      readCurrentLocation()
        .then((loc) => sendPulse(loc))
        .catch(() => {});
    }, LIVE_PRESENCE_PULSE_INTERVAL_MS);

    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            void sendPulse({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 30_000, timeout: 25_000 },
        );
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Location = (await import("expo-location")) as any;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    nativeWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy?.Balanced ?? 4,
        timeInterval: LIVE_PRESENCE_PULSE_INTERVAL_MS,
        distanceInterval: 40,
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
