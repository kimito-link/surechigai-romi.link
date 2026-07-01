/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP（BrandTagline）を AppHeader / ScreenContainer / tRPC より先に paint する。
 */
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { scheduleAfterIdle } from "@/lib/schedule-after-idle";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { color } from "@/theme/tokens";

const LazyAppHeader = lazy(() =>
  import("@/components/organisms/app-header").then((m) => ({ default: m.AppHeader })),
);

const LazyLoginPreviewBanner = lazy(() =>
  import("@/components/molecules/login-preview-banner").then((m) => ({
    default: m.LoginPreviewBanner,
  })),
);

const GUEST_HOME_BENEFITS = [
  { icon: "place" as const, label: "足あとを正確に残し、あとから地図でたどる" },
  { icon: "navigation" as const, label: "保存した場所へ「ここへ向かう」でナビ" },
  { icon: "groups" as const, label: "通りすがりの人とすれ違い、封筒が届く" },
  { icon: "calendar-today" as const, label: "集まりの予定を見て、ライブ表明もできる" },
  { icon: "map" as const, label: "みんなの現在地を都道府県マップで確認" },
];

export function PostGuestScreen() {
  const { isDesktop } = useResponsive();
  const tabInset = useTabBarInset();
  const [deferChrome, setDeferChrome] = useState(true);

  useEffect(() => {
    return scheduleAfterIdle(() => setDeferChrome(false), { fallbackDelayMs: 120 });
  }, []);

  const hero = (
    <View style={styles.hero}>
      <BrandTagline compact={false} align="center" />
      <Text style={styles.heroSub}>移動の足あとを残して、すれ違いと聖地巡礼を</Text>
      <BrandStamp variant="hero" />
    </View>
  );

  const cta = deferChrome ? null : (
    <Suspense fallback={null}>
      <LazyLoginPreviewBanner
        headline="ログインして、封筒と足あとを受け取ろう"
        benefits={GUEST_HOME_BENEFITS}
      />
    </Suspense>
  );

  const header = deferChrome ? (
    <View style={styles.headerStub} />
  ) : (
    <Suspense fallback={<View style={styles.headerStub} />}>
      <LazyAppHeader showLoginButton isDesktop={isDesktop} showMenu />
    </Suspense>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {header}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
      >
        {hero}
        {cta}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerStub: {
    height: 56,
    backgroundColor: "#E2EDF7",
    borderBottomWidth: 1,
    borderBottomColor: "#00427B40",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 24,
  },
  heroSub: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginTop: 12,
  },
});
