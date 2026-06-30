/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP（BrandTagline）を AppHeader / ScreenContainer / tRPC より先に paint する。
 */
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { scheduleAfterIdle } from "@/lib/schedule-after-idle";
import { tabBar } from "@/theme/tokens";

const LazyAppHeader = lazy(() =>
  import("@/components/organisms/app-header").then((m) => ({ default: m.AppHeader })),
);

const LazyLoginPreviewBanner = lazy(() =>
  import("@/components/molecules/login-preview-banner").then((m) => ({
    default: m.LoginPreviewBanner,
  })),
);

/** Web タブバー + safe area 下余白の目安（hooks チェーンを避ける）。 */
const GUEST_TAB_INSET = tabBar.bodyHeight + 12 + 12;

export function PostGuestScreen() {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const [deferChrome, setDeferChrome] = useState(true);

  useEffect(() => {
    return scheduleAfterIdle(() => setDeferChrome(false), { fallbackDelayMs: 120 });
  }, []);

  const heroHeight = isDesktop
    ? Math.min(Math.max(windowHeight * 0.42, 280), 420)
    : Math.min(Math.max(windowHeight * 0.36, 240), 320);

  const hero = (
    <View style={[styles.hero, { minHeight: heroHeight }]}>
      <BrandTagline compact={false} align="center" variant="heroDark" />
      <Text style={styles.heroSub}>移動の足あとを残して、すれ違いと聖地巡礼を</Text>
    </View>
  );

  const cta = deferChrome ? null : (
    <Suspense fallback={null}>
      <LazyLoginPreviewBanner headline="ログインして、封筒と足あとを受け取ろう" />
    </Suspense>
  );

  const header = deferChrome ? (
    <View style={styles.headerStub} />
  ) : (
    <Suspense fallback={<View style={styles.headerStub} />}>
      <LazyAppHeader showLoginButton />
    </Suspense>
  );

  return (
    <View style={styles.root}>
      {header}
      {isDesktop ? (
        <View style={styles.desktopBody}>
          {hero}
          <View style={styles.desktopCta}>{cta}</View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: GUEST_TAB_INSET }}
          showsVerticalScrollIndicator={false}
        >
          {hero}
          <View style={styles.mobileCta}>{cta}</View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020817",
  },
  headerStub: {
    height: 56,
    backgroundColor: "#E2EDF7",
    borderBottomWidth: 1,
    borderBottomColor: "#00427B40",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#020817",
  },
  desktopBody: {
    flex: 1,
    backgroundColor: "#020817",
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: "#020817",
  },
  heroSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginTop: 12,
  },
  desktopCta: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  mobileCta: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
