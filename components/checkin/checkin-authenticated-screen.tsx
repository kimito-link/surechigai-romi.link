/**
 * チェックイン画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * - 大きなチェックインボタン
 * - Web: navigator.geolocation / Native: expo-location
 * - encounter.checkIn 呼び出し → 結果演出
 * - 位置一時停止トグル（settings.pauseLocation / resume）
 * - 未ログイン時: X ログイン誘導
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { getAuthToken } from "@/lib/auth-token";
import { trpc } from "@/lib/trpc";
import { color, palette, contentMaxWidth, CHECKIN_STICKY_DOCK_HEIGHT, CHECKIN_MOBILE_WEB_CHROME, WEB_TAB_BAR_HEIGHT } from "@/theme/tokens";
import { computeCheckinScrollBottomInset } from "@/lib/layout/responsive-layout";
import { LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { formatDateTime } from "@/components/organisms/precision-tile-map";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { NavigateToPlaceButton } from "@/components/molecules/navigate-to-place-button";
import { SponsorCard, type SponsorCardData } from "@/components/molecules/sponsor-card";
import { CheckinPreviewCard } from "@/components/checkin/checkin-preview-card";
import { CheckinSuccessPanel } from "@/components/checkin/checkin-success-panel";
import { navigate } from "@/lib/navigation";
import { shareMyLocation } from "@/lib/share";
import { useToast } from "@/components/atoms/toast";
import { toUserFriendlyError } from "@/shared/error-messages";
import { isDesktopWeb } from "@/lib/get-current-location";
import {
  acquireCheckinLocation,
  canStartWebCheckinWarmup,
  formatCheckinAccuracy,
  startWebCheckinWarmup,
  type CheckinFix,
} from "@/lib/checkin-location-session";
import {
  hasCompletedPostLoginLocationIntro,
  PostLoginLocationIntro,
} from "@/features/onboarding/components/PostLoginLocationIntro";

type CheckinState = "idle" | "loading" | "adjust" | "success" | "error" | "zero";
type LoadingPhase = "locating" | "saving";
const RETRY_FIX_MAX_AGE_MS = 60_000;
const SPONSOR_CLIENT_CAP = 3;
const SPONSOR_CLIENT_COUNTER_KEY = "kimito:sponsor-impressions";

type SponsorClientCounter = {
  date: string;
  count: number;
};

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function readSponsorClientCounter(): SponsorClientCounter {
  const fallback = { date: todayKey(), count: 0 };
  if (Platform.OS !== "web" || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SPONSOR_CLIENT_COUNTER_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SponsorClientCounter>;
    if (parsed.date !== fallback.date || typeof parsed.count !== "number") return fallback;
    return { date: parsed.date, count: Math.max(0, parsed.count) };
  } catch {
    return fallback;
  }
}

function canRequestSponsorCard(): boolean {
  return readSponsorClientCounter().count < SPONSOR_CLIENT_CAP;
}

function rememberSponsorCardDisplay(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return true;
  try {
    const current = readSponsorClientCounter();
    const next = { date: todayKey(), count: Math.min(SPONSOR_CLIENT_CAP, current.count + 1) };
    window.localStorage.setItem(SPONSOR_CLIENT_COUNTER_KEY, JSON.stringify(next));
    return next.count < SPONSOR_CLIENT_CAP;
  } catch {
    return true;
  }
}

function resolveCheckinErrorMessage(err: unknown, fallback: string): string {
  console.error("[checkin] operation failed:", err);
  if (err && typeof err === "object" && "data" in err) {
    console.error("[checkin] tRPC error data:", (err as { data?: unknown }).data);
  }
  return err instanceof Error ? toUserFriendlyError(err).message : fallback;
}

export default function CheckinAuthenticatedScreen() {
  const { isDesktop, isMobile } = useResponsive();
  const { isAuthenticated, user } = useAuth();
  const tabInset = useTabBarInset();

  const [state, setState] = useState<CheckinState>("idle");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("locating");
  const [newCount, setNewCount] = useState(0);
  const [checkinLocationName, setCheckinLocationName] = useState<string | null>(null);
  const [checkinMunicipality, setCheckinMunicipality] = useState<string | null>(null);
  const [checkinPrefecture, setCheckinPrefecture] = useState<string | null>(null);
  const [checkinAddress, setCheckinAddress] = useState<string | null>(null);
  const [checkinLatLng, setCheckinLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [checkinAccuracyM, setCheckinAccuracyM] = useState<number | null>(null);
  const [checkinLocationId, setCheckinLocationId] = useState<number | null>(null);
  const [fixedMapCenter, setFixedMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPausing, setIsPausing] = useState(false);
  const [showLocationIntro, setShowLocationIntro] = useState(false);
  const [canRequestSponsor, setCanRequestSponsor] = useState(canRequestSponsorCard);
  const skipLocationIntroRef = useRef(false);
  const prewarmedFixRef = useRef<CheckinFix | null>(null);
  const lastFixRef = useRef<CheckinFix | null>(null);
  const activeLocationAbortRef = useRef<AbortController | null>(null);
  const displayedSponsorKeyRef = useRef<string | null>(null);
  // 二次的な設定・説明は折りたたみ（主役をファーストビューに集約するため）
  const [showSettings, setShowSettings] = useState(false);
  const utils = trpc.useUtils();
  const { showError } = useToast();

  // チェックイン直後にその場で「現在地をXでシェア」できる導線
  const shareSlugMutation = trpc.ogp.getOrCreateShareSlug.useMutation();
  const handleShareLocation = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const res = await shareSlugMutation.mutateAsync();
      const areaLabel =
        checkinMunicipality ??
        checkinPrefecture ??
        res.areaLabel ??
        undefined;
      await shareMyLocation(res.url, areaLabel);
    } catch {
      showError("共有リンクの作成に失敗しました。時間をおいて再度お試しください。");
    }
  }, [shareSlugMutation, showError, checkinMunicipality, checkinPrefecture]);

  // アニメーション
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // マップ用アニメーション
  const mapScale = useSharedValue(0.9);
  const mapOpacity = useSharedValue(0.8);

  // 測位中の無限パルスは画面離脱時に必ず止める（地雷2: cleanup漏れ対策）
  useEffect(() => {
    return () => {
      cancelAnimation(pulse);
      activeLocationAbortRef.current?.abort();
    };
  }, [pulse]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1 - (pulse.value - 1) * 3,
  }));

  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mapScale.value }],
    opacity: mapOpacity.value,
  }));

  const checkIn = trpc.encounter.checkIn.useMutation();
  const pauseLocation = trpc.settings.pauseLocation.useMutation();
  const resumeLocation = trpc.settings.resume.useMutation();
  const trackSponsor = trpc.ads.track.useMutation();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isDesktopBrowser = Platform.OS === "web" && isDesktopWeb();

  const { data: trailData } = trpc.zukan.myTrail.useQuery({ limit: 10 }, {
    enabled: isAuthenticated,
  });
  const latestLocation = trailData?.locations?.[0];

  const preciseAnchors = useMemo(
    () =>
      (trailData?.locations ?? [])
        .filter((loc) => loc.lat != null && loc.lng != null && loc.accuracyM != null)
        .map((loc) => ({
          lat: loc.lat,
          lng: loc.lng,
          accuracyM: loc.accuracyM,
          recordedAt: loc.recordedAt,
        })),
    [trailData],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "web") return undefined;

      let canceled = false;
      let warmupSession: { stop: () => void } | null = null;

      void canStartWebCheckinWarmup().then((canStart) => {
        if (canceled || !canStart) return;
        warmupSession = startWebCheckinWarmup({
          preciseAnchors,
          onProgress: (best) => {
            prewarmedFixRef.current = best;
          },
        });
      });

      return () => {
        canceled = true;
        warmupSession?.stop();
      };
    }, [preciseAnchors]),
  );

  // 設定が変わったら isPausing を同期
  useEffect(() => {
    const data = settingsQuery.data;
    if (data?.locationPausedUntil && new Date(data.locationPausedUntil) > new Date()) {
      setIsPausing(true);
    } else {
      setIsPausing(false);
    }
  }, [settingsQuery.data]);

  const handleMapPinAdjust = useCallback((coords: { lat: number; lng: number }) => {
    setCheckinLatLng(coords);
    setCheckinAccuracyM(8);
    lastFixRef.current = { lat: coords.lat, lng: coords.lng, accuracy: 8, observedAt: Date.now() };
  }, []);

  const performCheckinSave = useCallback(
    async (pos: { lat: number; lng: number; accuracy?: number }) => {
      setLoadingPhase("saving");

      let result;
      try {
        result = await checkIn.mutateAsync({
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
        });
      } catch (err) {
        console.error("[checkin] checkIn.mutateAsync failed:", err);
        throw err;
      }

      if (result.saved === false) {
        throw new Error("足あとを保存できませんでした。もう一度送ってください");
      }

      const locName = result.prefecture
        ? `${result.prefecture}${result.municipality || ""}${result.areaName ? ` ${result.areaName}` : ""}`
        : null;
      setCheckinLocationName(locName);
      setCheckinMunicipality(result.municipality ?? null);
      setCheckinPrefecture(result.prefecture ?? null);
      setCheckinAddress(result.address ?? null);
      setCheckinLatLng({ lat: result.lat, lng: result.lng });
      setCheckinAccuracyM(pos.accuracy ?? null);
      setCheckinLocationId(result.locationId ?? null);

      const latestLabel = [result.prefecture, result.municipality].filter(Boolean).join(" ") || null;
      utils.dashboard.mySignal.setData(undefined, (old) =>
        old
          ? {
              ...old,
              checkedInToday: true,
              latestPlaceLabel: latestLabel,
              latestRecordedAt: new Date(),
              trailCount: old.trailCount + 1,
            }
          : old,
      );

      const optimisticRecordedAt = new Date();
      const optimisticLocation = {
        id: -optimisticRecordedAt.getTime(),
        h3R8: "",
        latGrid: result.lat,
        lngGrid: result.lng,
        lat: result.lat,
        lng: result.lng,
        accuracyM: pos.accuracy ?? null,
        municipality: result.municipality,
        prefecture: result.prefecture,
        address: result.address ?? null,
        recordedAt: optimisticRecordedAt,
        visibility: "public" as const,
      };
      for (const limit of [1, 10, 120, 500] as const) {
        utils.zukan.myTrail.setData({ limit }, (old) => ({
          locations: [optimisticLocation, ...(old?.locations ?? [])],
        }));
      }
      utils.zukan.myAreas.setData(undefined, (old) => {
        if (!old || !result.prefecture) return old;
        const visited = [...old.visited];
        const idx = visited.findIndex((v) => v.prefecture === result.prefecture);
        if (idx >= 0) {
          visited[idx] = {
            ...visited[idx]!,
            visitCount: visited[idx]!.visitCount + 1,
            lastVisitedAt: optimisticRecordedAt,
            municipality: result.municipality ?? visited[idx]!.municipality,
          };
        } else {
          visited.unshift({
            prefecture: result.prefecture,
            municipality: result.municipality,
            visitCount: 1,
            lastVisitedAt: optimisticRecordedAt,
            firstVisitedAt: optimisticRecordedAt,
          });
        }
        return { ...old, visited };
      });

      await Promise.allSettled([
        utils.encounter.list.invalidate(),
        utils.zukan.myAreas.invalidate(),
        utils.zukan.myTrail.invalidate(),
        utils.settings.get.invalidate(),
        utils.dashboard.mySignal.invalidate(),
      ]);

      pulse.value = withTiming(1);

      mapScale.value = withSpring(1, { damping: 12 });
      mapOpacity.value = withTiming(1, { duration: 300 });

      if (result.newEncounters > 0) {
        lastFixRef.current = null;
        setState("success");
        setNewCount(result.newEncounters);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        lastFixRef.current = null;
        setState("zero");
      }
    },
    [checkIn, utils, pulse, mapScale, mapOpacity],
  );

  /** 測位して adjust または success/zero へ進む（state="adjust" の再測位からも呼ばれる） */
  const performLocateAndCheckin = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    scale.value = withSequence(
      withSpring(0.92, { duration: 100 }),
      withSpring(1.05, { duration: 150 }),
      withSpring(1, { duration: 100 }),
    );

    setState("loading");
    setLoadingPhase("locating");
    setErrorMsg("");

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
    );

    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error("ログインセッションを確認できません。もう一度Xログインしてください");
      }

      const retryFix =
        state === "error" &&
        lastFixRef.current &&
        Date.now() - lastFixRef.current.observedAt >= 0 &&
        Date.now() - lastFixRef.current.observedAt < RETRY_FIX_MAX_AGE_MS
          ? lastFixRef.current
          : null;

      activeLocationAbortRef.current?.abort();
      const controller = new AbortController();
      activeLocationAbortRef.current = controller;

      const authReady = utils.settings.get.fetch().catch(() => {
          throw new Error("ログインセッションをAPIで確認できません。もう一度Xログインしてください");
      });

      const locationResultPromise = retryFix
        ? Promise.resolve({ kind: "accepted" as const, fix: retryFix })
        : acquireCheckinLocation({
            preciseAnchors,
            prewarmedFix: prewarmedFixRef.current,
            signal: controller.signal,
            onProgress: (best) => {
              setCheckinLatLng({ lat: best.lat, lng: best.lng });
              setCheckinAccuracyM(best.accuracy ?? null);
              setFixedMapCenter({ lat: best.lat, lng: best.lng });
            },
          });

      const [, locationResult] = await Promise.all([authReady, locationResultPromise]);
      const pos = locationResult.fix;
      lastFixRef.current = pos;

      setCheckinLatLng({ lat: pos.lat, lng: pos.lng });
      setCheckinAccuracyM(pos.accuracy ?? null);
      setFixedMapCenter({ lat: pos.lat, lng: pos.lng });

      mapScale.value = withSpring(1, { damping: 12 });
      mapOpacity.value = withTiming(1, { duration: 300 });

      if (locationResult.kind === "review") {
        pulse.value = withTiming(1);
        setState("adjust");
        return;
      }

      await performCheckinSave(pos);
    } catch (err: unknown) {
      activeLocationAbortRef.current?.abort();
      pulse.value = withTiming(1);
      setState("error");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const msg = resolveCheckinErrorMessage(err, "位置情報の取得に失敗しました");
      setErrorMsg(msg);
    } finally {
      activeLocationAbortRef.current = null;
    }
  }, [
    performCheckinSave,
    utils,
    scale,
    pulse,
    mapScale,
    mapOpacity,
    preciseAnchors,
    state,
  ]);

  /** adjust 状態で「この場所に足あとを残す」: 確定済み座標でそのまま保存 */
  const confirmAdjustedCheckin = useCallback(async () => {
    if (!checkinLatLng) return;
    setState("loading");
    try {
      lastFixRef.current = {
        lat: checkinLatLng.lat,
        lng: checkinLatLng.lng,
        accuracy: checkinAccuracyM ?? 8,
        observedAt: Date.now(),
      };
      await performCheckinSave({
        lat: checkinLatLng.lat,
        lng: checkinLatLng.lng,
        accuracy: checkinAccuracyM ?? 8,
      });
    } catch (err: unknown) {
      pulse.value = withTiming(1);
      setState("error");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const msg = resolveCheckinErrorMessage(err, "チェックインに失敗しました");
      setErrorMsg(msg);
    }
  }, [checkinLatLng, checkinAccuracyM, performCheckinSave, pulse]);

  const handleCheckin = useCallback(async () => {
    if (state === "loading") return;

    if (state === "adjust") {
      await confirmAdjustedCheckin();
      return;
    }

    if (!skipLocationIntroRef.current) {
      const introDone = await hasCompletedPostLoginLocationIntro().catch(() => true);
      if (!introDone) {
        setShowLocationIntro(true);
        return;
      }
    }
    skipLocationIntroRef.current = false;

    await performLocateAndCheckin();
  }, [state, confirmAdjustedCheckin, performLocateAndCheckin]);

  /** 保存前プレビューで「もう一度測る」: adjust のまま再測位する（idle を経由しない） */
  const handleRetryLocation = useCallback(() => {
    void performLocateAndCheckin();
  }, [performLocateAndCheckin]);

  const handleLocationIntroAllow = useCallback(async () => {
    skipLocationIntroRef.current = true;
    setShowLocationIntro(false);
    await handleCheckin();
  }, [handleCheckin]);

  const handleLocationIntroLater = useCallback(() => {
    skipLocationIntroRef.current = false;
    setShowLocationIntro(false);
  }, []);

  const handlePauseToggle = useCallback(() => {
    if (pauseLocation.isPending || resumeLocation.isPending) return;

    if (isPausing) {
      resumeLocation.mutate(undefined, {
        onSuccess: () => {
          setIsPausing(false);
          void settingsQuery.refetch();
          void utils.settings.get.invalidate();
        },
      });
    } else {
      pauseLocation.mutate({ hours: 1 }, {
        onSuccess: () => {
          setIsPausing(true);
          void settingsQuery.refetch();
          void utils.settings.get.invalidate();
        },
      });
    }
  }, [isPausing, pauseLocation, resumeLocation, settingsQuery, utils]);

  const isPauseBusy = pauseLocation.isPending || resumeLocation.isPending;

  const getButtonColor = (): string => {
    switch (state) {
      case "success": return color.success;
      case "error": return color.danger;
      case "zero": return color.accentAlt;
      default: return color.accentIndigo;
    }
  };

  const getButtonIcon = (): string => {
    switch (state) {
      case "loading": return "refresh";
      case "success": return "check";
      case "error": return "close";
      case "zero": return "location-on";
      default: return "location-on";
    }
  };

  const getButtonLabel = (): string => {
    switch (state) {
      case "loading":
        return loadingPhase === "saving"
          ? "足あとを刻んでいます…"
          : isDesktopBrowser
            ? "現在地を探しています…"
            : "君のいる現在地を探しています…";
      case "adjust":
        return "この場所に足あとを残す";
      case "success": return `${newCount}件のすれ違い！`;
      case "error": return lastFixRef.current ? "もう一度送る" : "もう一度測る";
      case "zero": return "チェックイン完了";
      default: return "現在地を記録する";
    }
  };

  const locatingCopy = isDesktopBrowser
    ? "現在地を探しています…（PCは数秒かかります）"
    : "君のいる現在地を探しています…";
  const locatingAccuracy = formatCheckinAccuracy(checkinAccuracyM);
  const locatingBannerText =
    loadingPhase === "saving"
      ? "足あとを刻んでいます…"
      : locatingAccuracy
        ? `${locatingCopy} ${locatingAccuracy}`
        : locatingCopy;
  const adjustAccuracyHint =
    checkinAccuracyM != null && checkinAccuracyM > 10_000
      ? "この精度では残せません。地図をクリックして位置を指定してください。"
      : checkinAccuracyM != null && checkinAccuracyM > 80
        ? isDesktopBrowser
          ? "PCの測位はズレやすいです。地図をクリックして正しい位置に直せます。"
          : `精度 ${formatCheckinAccuracy(checkinAccuracyM)}。このまま残すか、もう一度測れます。`
        : isDesktopBrowser
          ? "スマホで記録した足あとが近くにあれば自動で寄せています。ズレている場合は地図をクリックして修正してください。"
          : null;

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  /** スマホは地図を小さくし、シェアCTAが常に見える余白を確保 */
  const mapHeroHeight = isMobile
    ? Math.min(Math.round(windowWidth * 0.72), 210)
    : Math.min(Math.round(windowHeight * 0.36), 400);
  const stickyDockHeight = CHECKIN_STICKY_DOCK_HEIGHT;
  const mobileWebChrome = Platform.OS === "web" && isMobile ? CHECKIN_MOBILE_WEB_CHROME : 0;
  const bottomScrollInset = computeCheckinScrollBottomInset({
    tabInset,
    stickyDockHeight,
    mobileWebChrome,
  });

  /** チェックイン後（または再チェックイン中・PC位置確認）は地図ファースト。 */
  const isMapFirst =
    state === "success" ||
    state === "zero" ||
    state === "adjust" ||
    (state === "loading" && checkinLatLng != null);
  const isCheckinComplete = state === "success" || state === "zero";

  const mapInteractive = isDesktopBrowser && (state === "adjust" || state === "zero" || state === "success");

  /** 今回のチェックイン座標を DB の古い足あとより優先（東京など過去地点の一瞬表示を防ぐ） */
  const mapPoint: TrailPoint | null =
    checkinLatLng
      ? {
          id: 0,
          lat: checkinLatLng.lat,
          lng: checkinLatLng.lng,
          accuracyM: checkinAccuracyM,
          municipality: null,
          prefecture: null,
          address: checkinAddress ?? checkinLocationName,
          recordedAt: new Date().toISOString(),
        }
      : latestLocation ?? null;

  const placeLine = checkinAddress ?? checkinLocationName;

  const sponsorQuery = trpc.ads.getCards.useQuery(
    {
      slot: "checkin_complete",
      prefecture: checkinPrefecture,
      municipality: checkinMunicipality,
    },
    {
      enabled: isAuthenticated && isCheckinComplete && canRequestSponsor,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );
  const sponsorCard = sponsorQuery.data?.cards[0] ?? null;

  useEffect(() => {
    if (!sponsorCard) return;
    const displayKey = [
      sponsorCard.id,
      checkinLocationId ?? "no-location-id",
      checkinLatLng?.lat.toFixed(6) ?? "no-lat",
      checkinLatLng?.lng.toFixed(6) ?? "no-lng",
    ].join(":");
    if (displayedSponsorKeyRef.current === displayKey) return;
    displayedSponsorKeyRef.current = displayKey;
    setCanRequestSponsor(rememberSponsorCardDisplay());
  }, [sponsorCard, checkinLocationId, checkinLatLng]);

  const handleSponsorPress = useCallback(
    (card: SponsorCardData) => {
      trackSponsor.mutate({ cardId: card.id, event: "click" });
    },
    [trackSponsor],
  );

  const pausedBanner = isPausing ? (
    <View style={styles.pausedBanner}>
      <MaterialIcons name="pause-circle-filled" size={18} color={color.warning} />
      <Text style={styles.pausedText}>位置情報は一時停止中です</Text>
    </View>
  ) : null;

  const settingsBlock = (
    <>
      <Pressable
        onPress={() => setShowSettings((v) => !v)}
        style={({ pressed }) => [styles.settingsToggle, pressed && { opacity: 0.7 }]}
      >
        <MaterialIcons
          name={isPausing ? "pause-circle-filled" : "tune"}
          size={18}
          color={isPausing ? color.warning : color.textMuted}
        />
        <Text style={styles.settingsToggleText}>設定・くわしく</Text>
        <MaterialIcons
          name={showSettings ? "expand-less" : "expand-more"}
          size={22}
          color={color.textMuted}
        />
      </Pressable>
      {showSettings && (
        <>
          <View style={styles.pauseSection}>
            <View style={styles.pauseRow}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <Text style={styles.pauseTitle}>位置情報を一時停止</Text>
                <Text style={styles.pauseSubtitle}>停止中はチェックインできません</Text>
              </View>
              <Pressable
                onPress={handlePauseToggle}
                disabled={isPauseBusy}
                style={({ pressed }) => [
                  styles.pauseToggle,
                  { backgroundColor: isPausing ? color.accentPrimary : color.border },
                  pressed && !isPauseBusy && { opacity: 0.7 },
                  isPauseBusy && { opacity: 0.5 },
                ]}
              >
                <View
                  style={[
                    styles.pauseKnob,
                    { transform: [{ translateX: isPausing ? 20 : 0 }] },
                  ]}
                />
              </Pressable>
            </View>
            {isPausing && (
              <Text style={styles.pauseHint}>1時間後に自動再開されます（最大72時間）</Text>
            )}
          </View>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MaterialIcons name="security" size={16} color={color.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>
                正確な位置情報を保存し、後から足あとをたどれるようにします
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={16} color={color.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>
                すれ違い判定にはH3セルと丸めたグリッドも併用します
              </Text>
            </View>
          </View>
        </>
      )}
    </>
  );

  // 認証済み画面本体（親 checkin.tsx がゲート済み）

  return (
    <ScreenContainer containerClassName="bg-background" style={isMapFirst ? styles.screenFlex : undefined}>
        <TabScreenHeader
          title="チェックイン"
          contextKey="checkin"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu={true}
          showLoginButton={!isAuthenticated}
        />

        {isMapFirst && mapPoint ? (
          /* チェックイン後: 地図 + スクロール詳細 + 下部固定シェア（主役=Xシェア） */
          <View style={styles.mapFirstRoot}>
            {pausedBanner}

            <ScrollView
              style={styles.bottomSheetScroll}
              contentContainerStyle={[
                styles.bottomSheetContent,
                { paddingBottom: bottomScrollInset },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {state === "loading" ? (
                <View style={styles.encounterBanner}>
                  <Text style={styles.encounterBannerText}>{locatingBannerText}</Text>
                </View>
              ) : null}

              {state === "adjust" && mapPoint ? (
                <CheckinPreviewCard
                  mapPoint={mapPoint}
                  mapCenter={fixedMapCenter ?? { lat: mapPoint.lat, lng: mapPoint.lng }}
                  mapHeight={mapHeroHeight}
                  mapWidth={Math.min(windowWidth - 32, contentMaxWidth.standard)}
                  accuracyM={checkinAccuracyM}
                  placeLabel={placeLine}
                  userImageUrl={user?.profileImage ?? undefined}
                  isRetrying={false}
                  interactive={mapInteractive}
                  onCoordinateSelect={handleMapPinAdjust}
                  onRetry={handleRetryLocation}
                  onSave={handleCheckin}
                />
              ) : null}

              {(state === "success" || state === "zero") && mapPoint ? (
                <CheckinSuccessPanel
                  mapPoint={mapPoint}
                  mapCenter={fixedMapCenter ?? { lat: mapPoint.lat, lng: mapPoint.lng }}
                  mapHeight={mapHeroHeight}
                  mapWidth={Math.min(windowWidth - 32, contentMaxWidth.standard)}
                  accuracyM={checkinAccuracyM}
                  placeLabel={placeLine}
                  recordedAtLabel={formatDateTime(mapPoint.recordedAt)}
                  newEncounterCount={state === "success" ? newCount : 0}
                  userImageUrl={user?.profileImage ?? undefined}
                  onViewMap={() =>
                    navigate.toMapTab(
                      checkinLocationId != null
                        ? { focus: String(checkinLocationId) }
                        : undefined,
                    )
                  }
                  onShare={handleShareLocation}
                  isSharing={shareSlugMutation.isPending}
                />
              ) : null}

              {state === "success" || state === "zero" ? (
                <View style={styles.bottomSheet}>
                  <Text style={styles.privacyNote}>
                    正確な場所を保存します。プライバシーが気になる方は移動専用アカウントの利用をおすすめします。
                  </Text>

                  <Pressable
                    onPress={handleCheckin}
                    disabled={isPausing}
                    style={({ pressed }) => [
                      styles.recheckButton,
                      isPausing && { opacity: 0.55 },
                      pressed && !isPausing && { opacity: 0.85 },
                    ]}
                  >
                    <MaterialIcons name="refresh" size={18} color={color.accentIndigo} />
                    <Text style={styles.recheckButtonText}>もう一度チェックイン</Text>
                  </Pressable>

                  {settingsBlock}
                </View>
              ) : null}

              {isCheckinComplete && sponsorCard ? (
                <SponsorCard
                  card={sponsorCard}
                  onPress={handleSponsorPress}
                  testID="checkin-sponsor-card"
                />
              ) : null}

              {state === "adjust" ? (
                <View style={styles.bottomSheet}>
                  {adjustAccuracyHint ? (
                    <Text style={styles.accuracyHint}>{adjustAccuracyHint}</Text>
                  ) : null}
                  {settingsBlock}
                </View>
              ) : null}
            </ScrollView>

            {/* success/zero は成功パネル内の「地図で見る/Xでシェア」が出口を担うため、
                測位・確認中（loading/adjust）だけ下部固定ドックでシェア導線を待機表示する。
                Web モバイルでは Tabs の固定タブバー（position:fixed, zIndex:100）と
                このドック（position:absolute, zIndex:20）が別レイヤーで両方 bottom を
                主張するため、ドックの View 自体をタブバーの実高さぶん持ち上げて
                隙間なく重ねる（2026-07-05: スクロール/スワイプ中に帯が二段に見える不具合の修正）。 */}
            {state === "loading" || state === "adjust" ? (
              <View
                style={[
                  styles.stickyShareDock,
                  Platform.OS === "web" && isMobile
                    ? { bottom: WEB_TAB_BAR_HEIGHT, paddingBottom: 10 }
                    : { paddingBottom: tabInset + mobileWebChrome },
                ]}
              >
                <Pressable
                  disabled
                  style={[styles.shareButton, styles.shareButtonSticky, { opacity: 0.5 }]}
                  accessibilityLabel="この現在地をXでシェア（記録完了後に押せます）"
                >
                  <MaterialIcons name="ios-share" size={20} color={color.textWhite} />
                  <Text style={styles.shareButtonText}>この現在地をXでシェア</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          /* チェックイン前: ボタンファースト */
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>
              会いたい君がいる現在地を、正確な足あととして残します
            </Text>

            {pausedBanner}

            <View style={styles.buttonWrap}>
              {state === "loading" && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { borderColor: getButtonColor() + "66" },
                    pulseStyle,
                  ]}
                />
              )}

              <Animated.View style={[buttonStyle, styles.primaryButtonAnimated]}>
                <Pressable
                  onPress={handleCheckin}
                  disabled={state === "loading" || isPausing}
                  style={({ pressed }) => [
                    styles.checkinButton,
                    { backgroundColor: isPausing ? color.border : getButtonColor() },
                    pressed && { opacity: 0.85 },
                    (state === "loading" || isPausing) && { opacity: 0.8 },
                  ]}
                >
                  <MaterialIcons
                    name={getButtonIcon() as "check" | "close" | "refresh" | "location-on"}
                    size={22}
                    color={color.textWhite}
                  />
                  <Text style={styles.checkinButtonText}>{getButtonLabel()}</Text>
                </Pressable>
              </Animated.View>
            </View>

            {state === "error" && (
              <View style={[styles.resultBox, { backgroundColor: color.danger + "22" }]}>
                <Text style={[styles.resultTitle, { color: color.danger }]}>
                  エラーが発生しました
                </Text>
                <Text style={styles.resultSubtitle}>{errorMsg}</Text>
              </View>
            )}

            {mapPoint && state === "idle" && (
              <Animated.View style={[styles.mapContainer, mapStyle]}>
                <MapErrorBoundary mapType="heatmap" height={200}>
                  <LazyPrecisionTileMap
                    locations={[mapPoint]}
                    zoom={17}
                    showInfoPanel={false}
                    height={200}
                    markerSize={28}
                    containerStyle={styles.mapInner}
                    userImageUrl={user?.profileImage ?? undefined}
                  />
                </MapErrorBoundary>
              </Animated.View>
            )}

            {settingsBlock}
          </ScrollView>
        )}
      <PostLoginLocationIntro
        visible={showLocationIntro}
        onAllow={handleLocationIntroAllow}
        onLater={handleLocationIntroLater}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  screenFlex: {
    flex: 1,
  },
  mapFirstRoot: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  mapHeroCompact: {
    width: "100%",
    alignItems: "center",
    marginBottom: 4,
  },
  stickyShareDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: "center",
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 20,
  },
  encounterBanner: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: color.accentIndigo + "18",
    borderWidth: 1,
    borderColor: color.accentIndigo + "44",
    alignItems: "center",
  },
  encounterBannerSuccess: {
    backgroundColor: color.success + "18",
    borderColor: color.success + "55",
  },
  encounterBannerZero: {
    backgroundColor: color.accentAlt + "18",
    borderColor: color.accentAlt + "55",
  },
  encounterBannerText: {
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  mapHero: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bottomSheetScroll: {
    flex: 1,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    alignItems: "center",
  },
  bottomSheet: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    backgroundColor: color.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: color.border,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetHint: {
    color: color.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  bottomSheetHintLink: {
    color: color.accentIndigo,
    fontWeight: "700",
    minHeight: 44,
    lineHeight: 44,
  },
  placeLine: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  coordLine: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  accuracyHint: {
    color: color.warning,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4,
  },
  privacyNote: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  shareButtonFull: {
    alignSelf: "stretch",
    width: "100%",
  },
  shareButtonSticky: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#0F1419",
  },
  recheckButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.accentIndigo,
    backgroundColor: color.surface,
  },
  recheckButtonText: {
    color: color.accentIndigo,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmCheckinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: color.accentIndigo,
  },
  confirmCheckinButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: color.textMuted,
    fontSize: 14,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  description: {
    color: color.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  pausedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: color.warning + "22",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.warning + "44",
  },
  pausedText: {
    color: color.warning,
    fontSize: 13,
    fontWeight: "600",
  },
  buttonWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    marginVertical: 4,
  },
  pulseRing: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
  },
  primaryButtonAnimated: {
    width: "100%",
  },
  checkinButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  checkinButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "800",
  },
  checkmarkOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  resultBox: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  resultSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    backgroundColor: palette.black,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  shareButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "700",
  },
  // Pause toggle
  pauseSection: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  pauseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pauseTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  pauseSubtitle: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pauseToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  pauseKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.textWhite,
  },
  pauseHint: {
    color: color.textMuted,
    fontSize: 11,
  },
  // Info section
  infoSection: {
    width: "100%",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    color: color.textMuted,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  // Login gate
  loginGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loginGateTitle: {
    color: color.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginGateSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.black,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  loginButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  // Map container
  mapContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    position: "relative",
  },
  mapInner: {
    borderRadius: 16,
    width: "100%",
  },
  settingsToggle: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: color.surface,
  },
  settingsToggleText: {
    flex: 1,
    color: color.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
});
