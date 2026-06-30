/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * レーダー / tRPC / reanimated chunk を読まない（LCP をテキストで早く出す）。
 */
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { useResponsive } from "@/hooks/use-responsive";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";

export function PostGuestScreen() {
  const { isDesktop } = useResponsive();
  const tabInset = useTabBarInset();
  const { height: windowHeight } = useWindowDimensions();
  const heroHeight = isDesktop
    ? Math.min(Math.max(windowHeight * 0.42, 280), 420)
    : Math.min(Math.max(windowHeight * 0.36, 240), 320);

  const hero = (
    <View style={[styles.hero, { minHeight: heroHeight }]}>
      <View style={styles.heroInner}>
        <BrandTagline compact={false} align="center" />
        <Text style={styles.heroSub}>
          移動の足あとを残して、すれ違いと聖地巡礼を
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer style={styles.screen} edges={[]}>
      <AppHeader showLoginButton />
      {isDesktop ? (
        <View style={styles.desktopBody}>
          {hero}
          <View style={styles.desktopCta}>
            <LoginPreviewBanner headline="ログインして、封筒と足あとを受け取ろう" />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: tabInset }}
          showsVerticalScrollIndicator={false}
        >
          {hero}
          <View style={styles.mobileCta}>
            <LoginPreviewBanner headline="ログインして、封筒と足あとを受け取ろう" />
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#020817",
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
    position: "relative",
    backgroundColor: "#020817",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heroInner: {
    alignItems: "center",
    gap: 12,
    zIndex: 2,
  },
  heroSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
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
