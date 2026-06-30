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
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { getAuthToken } from "@/lib/auth-token";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { PrecisionTileMap, type TrailPoint } from "@/components/organisms/precision-tile-map";
import { useRouter } from "expo-router";
import { shareMyLocation } from "@/lib/share";
import { useToast } from "@/components/atoms/toast";

/** Web用 Geolocation ラッパー */
function getWebLocation(): Promise<{ lat: number; lng: number; accuracy?: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/** Native用 expo-location ラッパー（動的import） */
async function getNativeLocation(): Promise<{ lat: number; lng: number; accuracy?: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Location = (await import("expo-location")) as any;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("位置情報の権限がありません");
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy?.Balanced ?? 4,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

async function getCurrentLocation(): Promise<{ lat: number; lng: number; accuracy?: number }> {
  if (Platform.OS === "web") {
    return getWebLocation();
  }
  return getNativeLocation();
}

type CheckinState = "idle" | "loading" | "success" | "error" | "zero";
type LoadingPhase = "locating" | "saving";

export default function CheckinScreen() {
  const { isDesktop, isMobile } = useResponsive();
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const tabInset = useTabBarInset();

  const [state, setState] = useState<CheckinState>("idle");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("locating");
  const [newCount, setNewCount] = useState(0);
  const [checkinLocationName, setCheckinLocationName] = useState<string | null>(null);
  const [checkinAddress, setCheckinAddress] = useState<string | null>(null);
  const [checkinLatLng, setCheckinLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPausing, setIsPausing] = useState(false);
  // 二次的な設定・説明は折りたたみ（主役をファーストビューに集約するため）
  const [showSettings, setShowSettings] = useState(false);
  const utils = trpc.useUtils();
  const router = useRouter();
  const { showError } = useToast();

  // チェックイン直後にその場で「現在地をXでシェア」できる導線
  const shareSlugMutation = trpc.ogp.getOrCreateShareSlug.useMutation();
  const handleShareLocation = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const res = await shareSlugMutation.mutateAsync();
      await shareMyLocation(res.url, res.areaLabel ?? undefined);
    } catch {
      showError("共有リンクの作成に失敗しました。時間をおいて再度お試しください。");
    }
  }, [shareSlugMutation, showError]);

  // アニメーション
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // マップ用アニメーション
  const mapScale = useSharedValue(0.9);
  const mapOpacity = useSharedValue(0.8);

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
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: trailData } = trpc.zukan.myTrail.useQuery({ limit: 1 }, {
    enabled: isAuthenticated,
  });
  const latestLocation = trailData?.locations?.[0];

  // 設定が変わったら isPausing を同期
  useEffect(() => {
    const data = settingsQuery.data;
    if (data?.locationPausedUntil && new Date(data.locationPausedUntil) > new Date()) {
      setIsPausing(true);
    } else {
      setIsPausing(false);
    }
  }, [settingsQuery.data]);

  const handleCheckin = useCallback(async () => {
    if (state === "loading") return;

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

    // パルスアニメーション開始
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

      const [, pos] = await Promise.all([
        utils.settings.get.fetch().catch(() => {
          throw new Error("ログインセッションをAPIで確認できません。もう一度Xログインしてください");
        }),
        getCurrentLocation(),
      ]);

      if (pos.accuracy && pos.accuracy > 10000) {
        throw new Error("位置精度が低すぎます。より精度の良い位置情報が必要です");
      }

      setLoadingPhase("saving");

      const result = await checkIn.mutateAsync({
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
      });

      const locName = result.prefecture 
        ? `${result.prefecture}${result.municipality || ""}${result.areaName ? ` ${result.areaName}` : ""}`
        : null;
      setCheckinLocationName(locName);
      setCheckinAddress(result.address ?? null);
      setCheckinLatLng({ lat: result.lat, lng: result.lng });

      await Promise.allSettled([
        utils.encounter.list.invalidate(),
        utils.zukan.myAreas.invalidate(),
        utils.zukan.myTrail.invalidate(),
        utils.settings.get.invalidate(),
      ]);

      pulse.value = withTiming(1);
      
      // マップのアニメーション
      mapScale.value = withSpring(1, { damping: 12 });
      mapOpacity.value = withTiming(1, { duration: 300 });

      if (result.newEncounters > 0) {
        setState("success");
        setNewCount(result.newEncounters);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setState("zero");
      }

      // 結果（住所・座標・地図）は自動で消さず、次のチェックインまで表示し続ける。
      //   ユーザーが「後でその場所をたどれる」よう現在地を残す方針のため。
    } catch (err: unknown) {
      pulse.value = withTiming(1);
      setState("error");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const msg = err instanceof Error ? err.message : "位置情報の取得に失敗しました";
      setErrorMsg(msg);

      setTimeout(() => setState("idle"), 4000);
    }
  }, [state, checkIn, utils, scale, pulse]);

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
        return loadingPhase === "saving" ? "記録中…" : "位置を取得中…";
      case "success": return `${newCount}件のすれ違い！`;
      case "error": return "エラー";
      case "zero": return "チェックイン完了";
      default: return "チェックイン";
    }
  };

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  /** スマホは地図を小さくし、シェアCTAが常に見える余白を確保 */
  const mapHeroHeight = isMobile
    ? Math.min(Math.round(windowWidth * 0.72), 210)
    : Math.min(Math.round(windowHeight * 0.36), 400);
  const stickyDockHeight = 76;
  const mobileWebChrome = Platform.OS === "web" && isMobile ? 40 : 0;
  const bottomScrollInset = tabInset + stickyDockHeight + mobileWebChrome;

  /** チェックイン後（または再チェックイン中）は地図ファースト。前はボタンファースト。 */
  const isMapFirst =
    (state === "success" || state === "zero" || (state === "loading" && checkinLatLng != null));

  const mapPoint: TrailPoint | null = latestLocation
    ?? (checkinLatLng
      ? {
          id: 0,
          lat: checkinLatLng.lat,
          lng: checkinLatLng.lng,
          accuracyM: null,
          municipality: null,
          prefecture: null,
          address: checkinAddress ?? checkinLocationName,
          recordedAt: new Date().toISOString(),
        }
      : null);

  const placeLine = checkinAddress ?? checkinLocationName;
  const coordLine = checkinLatLng
    ? `(${checkinLatLng.lat.toFixed(6)}, ${checkinLatLng.lng.toFixed(6)})`
    : null;

  const headerLeft = (
    <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
      <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
    </Pressable>
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
              <View style={{ flex: 1 }}>
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

  // ゲート判定は「実ロード完了(isAuthReady)」基準。1秒タイムアウトの isAuthReadyForUI で
  // 判定するとリロード時のハンドシェイク中(>1s)にセッションがあるのにゲートを誤表示し、
  // 「You're already signed in」を誘発する。実ロードを待ってから判定する。
  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="チェックイン"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu={true}
          showLoginButton={!isAuthenticated}
          leftElement={
            <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
              <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
        />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="チェックイン"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          showLoginButton
          leftElement={headerLeft}
        />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
          showsVerticalScrollIndicator={false}
        >
          <LoginPreviewBanner
            headline="ログインすると、今いる場所を記録してすれ違いが成立します"
            benefits={[
              { icon: "place", label: "正確な現在地を足あととして残せる" },
              { icon: "groups", label: "同じ場所を通った人とすれ違える" },
              { icon: "ios-share", label: "チェックインした場所をXでシェアできる" },
            ]}
          />
          <Text style={styles.description}>
            現在地を記録して、すれ違いを探します
          </Text>
          <View style={styles.buttonWrap}>
            <View style={[styles.checkinButton, { backgroundColor: color.border, opacity: 0.85 }]}>
              <MaterialIcons name="location-on" size={48} color={color.textWhite} />
            </View>
            <Text style={styles.buttonLabel}>ログイン後にチェックインできます</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" style={isMapFirst ? styles.screenFlex : undefined}>
        <AppHeader
          title="チェックイン"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu={true}
          showLoginButton={!isAuthenticated}
          leftElement={headerLeft}
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
              <View
                style={[
                  styles.encounterBanner,
                  state === "success" && styles.encounterBannerSuccess,
                  state === "zero" && styles.encounterBannerZero,
                ]}
              >
                {state === "loading" ? (
                  <Text style={styles.encounterBannerText}>
                    {loadingPhase === "saving" ? "記録中…" : "位置を取得中…"}
                  </Text>
                ) : state === "success" ? (
                  <Text style={styles.encounterBannerText}>
                    {newCount}件のすれ違いが届きました！
                  </Text>
                ) : (
                  <Text style={styles.encounterBannerText}>チェックイン完了</Text>
                )}
              </View>

              <Animated.View style={[styles.mapHeroCompact, mapStyle]}>
                <PrecisionTileMap
                  locations={[mapPoint]}
                  zoom={17}
                  showInfoPanel={false}
                  height={mapHeroHeight}
                  width={Math.min(windowWidth - 32, 980)}
                  markerSize={28}
                  containerStyle={styles.mapInner}
                  userImageUrl={user?.profileImage ?? undefined}
                />
              </Animated.View>

              <View style={styles.bottomSheet}>
                {state === "success" ? (
                  <Pressable
                    onPress={() => router.push("/(tabs)")}
                    style={({ pressed }) => [pressed && { opacity: 0.75 }]}
                    accessibilityLabel="ホームですれ違いを見る"
                  >
                    <Text style={[styles.bottomSheetHint, styles.bottomSheetHintLink]}>
                      ポストを見てみよう →
                    </Text>
                  </Pressable>
                ) : null}
                {state === "zero" ? (
                  <Text style={styles.bottomSheetHint}>
                    まだ誰も… あなたの軌跡が誰かの封筒になります
                  </Text>
                ) : null}

                {placeLine ? (
                  <Text style={styles.placeLine} numberOfLines={3}>{placeLine}</Text>
                ) : null}
                {coordLine ? (
                  <Text style={styles.coordLine}>{coordLine}</Text>
                ) : null}

                <Text style={styles.privacyNote}>
                  正確な場所を保存します。プライバシーが気になる方は移動専用アカウントの利用をおすすめします。
                </Text>

                <Pressable
                  onPress={handleCheckin}
                  disabled={state === "loading" || isPausing}
                  style={({ pressed }) => [
                    styles.recheckButton,
                    (state === "loading" || isPausing) && { opacity: 0.55 },
                    pressed && !isPausing && state !== "loading" && { opacity: 0.85 },
                  ]}
                >
                  <MaterialIcons name="refresh" size={18} color={color.accentIndigo} />
                  <Text style={styles.recheckButtonText}>
                    {state === "loading"
                      ? loadingPhase === "saving"
                        ? "記録中…"
                        : "位置を取得中…"
                      : "もう一度チェックイン"}
                  </Text>
                </Pressable>

                {settingsBlock}
              </View>
            </ScrollView>

            {/* シェアはスクロール外・タブバー直上に固定（最重要CTA） */}
            <View
              style={[
                styles.stickyShareDock,
                { paddingBottom: tabInset + mobileWebChrome },
              ]}
            >
              <Pressable
                onPress={handleShareLocation}
                disabled={shareSlugMutation.isPending || state === "loading"}
                style={({ pressed }) => [
                  styles.shareButton,
                  styles.shareButtonSticky,
                  pressed && { opacity: 0.9 },
                  (shareSlugMutation.isPending || state === "loading") && { opacity: 0.6 },
                ]}
                accessibilityLabel="この現在地をXでシェア"
                testID="checkin-share-button"
              >
                <MaterialIcons name="ios-share" size={20} color={color.textWhite} />
                <Text style={styles.shareButtonText}>
                  {shareSlugMutation.isPending ? "リンクを準備中…" : "この現在地をXでシェア"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* チェックイン前: ボタンファースト */
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>
              現在地を記録して、すれ違いを探します
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

              <Animated.View style={buttonStyle}>
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
                    size={48}
                    color={color.textWhite}
                  />
                </Pressable>
              </Animated.View>

              <Text style={styles.buttonLabel}>{getButtonLabel()}</Text>
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
                <PrecisionTileMap
                  locations={[mapPoint]}
                  zoom={17}
                  showInfoPanel={false}
                  height={200}
                  markerSize={28}
                  containerStyle={styles.mapInner}
                  userImageUrl={user?.profileImage ?? undefined}
                />
              </Animated.View>
            )}

            {settingsBlock}
          </ScrollView>
        )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    marginHorizontal: 16,
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
  },
  bottomSheet: {
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
    alignSelf: "stretch",
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: palette.twitter,
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
    gap: 10,
    marginVertical: 4,
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  checkinButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
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
