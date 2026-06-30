/**
 * チェックイン画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は reanimated / 地図 chunk を読まない。
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { lazy, Suspense } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { color, palette } from "@/theme/tokens";
import { ChunkFallback } from "@/lib/lazy-heavy-components";

const CheckinAuthenticatedScreen = lazy(() =>
  import("@/components/checkin/checkin-authenticated-screen"),
);

export default function CheckinScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReady } = useAuth();
  const tabInset = useTabBarInset();

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="チェックイン"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          showLoginButton={!isAuthenticated}
        />
        <View style={styles.authLoading}>
          <ActivityIndicator size="large" color={palette.kimitoBlue} />
        </View>
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
          <Text style={styles.description}>現在地を記録して、すれ違いを探します</Text>
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
    <Suspense fallback={<ChunkFallback minHeight={480} />}>
      <CheckinAuthenticatedScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  description: {
    color: color.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  buttonWrap: {
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  checkinButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    color: color.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
