/**
 * チェックイン画面
 * すれちがいロミ MVP
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
  Alert,
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
import { GlobalLoginGate } from "@/components/organisms/global-login-gate";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";

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

export default function CheckinScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReadyForUI, login } = useAuth();

  const [state, setState] = useState<CheckinState>("idle");
  const [newCount, setNewCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPausing, setIsPausing] = useState(false);

  // アニメーション
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);
  const checkmarkScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1 - (pulse.value - 1) * 3,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkOpacity.value,
  }));

  const checkIn = trpc.encounter.checkIn.useMutation();
  const pauseLocation = trpc.settings.pauseLocation.useMutation();
  const resumeLocation = trpc.settings.resume.useMutation();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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

    // パルスアニメーション開始
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
    );

    try {
      const pos = await getCurrentLocation();

      if (pos.accuracy && pos.accuracy > 10000) {
        throw new Error("位置精度が低すぎます。より精度の良い位置情報が必要です");
      }

      const result = await checkIn.mutateAsync({
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
      });

      pulse.value = withTiming(1);

      if (result.newEncounters > 0) {
        setState("success");
        setNewCount(result.newEncounters);

        checkmarkScale.value = withSpring(1, { damping: 10 });
        checkmarkOpacity.value = withTiming(1, { duration: 200 });

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setState("zero");
      }

      // 5秒後にリセット
      setTimeout(() => {
        setState("idle");
        checkmarkScale.value = withTiming(0);
        checkmarkOpacity.value = withTiming(0);
      }, 5000);
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
  }, [state, checkIn, scale, pulse, checkmarkScale, checkmarkOpacity]);

  const handlePauseToggle = useCallback(() => {
    if (isPausing) {
      resumeLocation.mutate(undefined, {
        onSuccess: () => {
          setIsPausing(false);
          settingsQuery.refetch();
        },
      });
    } else {
      pauseLocation.mutate({ hours: 1 }, {
        onSuccess: () => {
          setIsPausing(true);
          settingsQuery.refetch();
        },
      });
    }
  }, [isPausing, pauseLocation, resumeLocation, settingsQuery]);

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
      case "loading": return "位置情報を取得中...";
      case "success": return `${newCount}件のすれ違い！`;
      case "error": return "エラー";
      case "zero": return "チェックイン完了";
      default: return "チェックイン";
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="チェックイン"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={!isAuthenticated}
      />

      {!isAuthReadyForUI ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      ) : !isAuthenticated ? (
        <GlobalLoginGate
          title="チェックイン"
          subtitle={`チェックインすると近くにいた人と\nすれ違いが成立します`}
          onLogin={login}
          headerTitle="チェックイン"
          isDesktop={isDesktop}
        />
      ) : (
        <View style={styles.content}>
          {/* 説明文 */}
          <Text style={styles.description}>
            現在地を記録し、{"\n"}すれ違いを探します
          </Text>

          {/* 一時停止バナー */}
          {isPausing && (
            <View style={styles.pausedBanner}>
              <MaterialIcons name="pause-circle-filled" size={18} color={color.warning} />
              <Text style={styles.pausedText}>位置情報は一時停止中です</Text>
            </View>
          )}

          {/* メインボタン */}
          <View style={styles.buttonWrap}>
            {/* パルスリング */}
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
                {/* チェックマークアニメーション（成功時） */}
                {state === "success" && (
                  <Animated.View style={[styles.checkmarkOverlay, checkmarkStyle]}>
                    <MaterialIcons name="check" size={56} color={color.textWhite} />
                  </Animated.View>
                )}

                <MaterialIcons
                  name={getButtonIcon() as "check" | "close" | "refresh" | "location-on"}
                  size={48}
                  color={color.textWhite}
                />
              </Pressable>
            </Animated.View>

            <Text style={styles.buttonLabel}>{getButtonLabel()}</Text>
          </View>

          {/* 結果メッセージ */}
          {state === "success" && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>
                {newCount}件のすれ違いが届きました！
              </Text>
              <Text style={styles.resultSubtitle}>
                ポストを見てみよう
              </Text>
            </View>
          )}

          {state === "zero" && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>チェックイン完了</Text>
              <Text style={styles.resultSubtitle}>
                まだ誰も…{"\n"}あなたの軌跡が誰かの封筒になります
              </Text>
            </View>
          )}

          {state === "error" && (
            <View style={[styles.resultBox, { backgroundColor: color.danger + "22" }]}>
              <Text style={[styles.resultTitle, { color: color.danger }]}>
                エラーが発生しました
              </Text>
              <Text style={styles.resultSubtitle}>{errorMsg}</Text>
            </View>
          )}

          {/* 位置一時停止トグル */}
          <View style={styles.pauseSection}>
            <View style={styles.pauseRow}>
              <View>
                <Text style={styles.pauseTitle}>位置情報を一時停止</Text>
                <Text style={styles.pauseSubtitle}>
                  停止中はチェックインできません
                </Text>
              </View>
              <Pressable
                onPress={handlePauseToggle}
                style={({ pressed }) => [
                  styles.pauseToggle,
                  { backgroundColor: isPausing ? color.accentPrimary : color.border },
                  pressed && { opacity: 0.7 },
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
              <Text style={styles.pauseHint}>
                1時間後に自動再開されます（最大72時間）
              </Text>
            )}
          </View>

          {/* 説明 */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MaterialIcons name="security" size={16} color={color.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>
                正確な位置情報は保存されません（約460m単位で丸めて記録）
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={16} color={color.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>
                位置データは48時間後に自動削除されます
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  description: {
    color: color.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
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
    gap: 12,
    marginVertical: 8,
  },
  pulseRing: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 3,
  },
  checkinButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
    backgroundColor: color.twitter,
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
});
