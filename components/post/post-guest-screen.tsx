/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP: ヘッダー + タグライン + CTA を初回 paint で同期描画。
 */
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { MARKETING_URL } from "@/lib/site-urls";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { SIGN_IN_HREF } from "@/lib/clerk-route";
import { RadarGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { color, palette } from "@/theme/tokens";
import {
  GuestHomeShellHeader,
  GUEST_HOME_HEADER_HEIGHT,
} from "@/components/post/guest-home-shell-header";

const GUEST_HOME_BENEFITS = [
  { icon: "place", label: "足あと" },
  { icon: "mail-outline", label: "封筒" },
  { icon: "groups", label: "すれ違い" },
] as const;

export function PostGuestScreen() {
  const tabInset = useTabBarInset();
  const openLoginGuide = useLoginGuide();

  const headerOffset = Platform.OS === "web" ? GUEST_HOME_HEADER_HEIGHT : 0;

  return (
    <View style={styles.root}>
      <GuestHomeShellHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 8 + headerOffset, paddingBottom: tabInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <BrandTagline compact={false} align="center" lcpProminent />
          <Text style={styles.heroSub}>移動の足あとを残して、すれ違いと聖地巡礼を</Text>
        </View>
        <View style={styles.previewWrap}>
          <RadarGuestPreview />
        </View>
        <View style={styles.benefits}>
          {GUEST_HOME_BENEFITS.map((benefit) => (
            <View key={benefit.label} style={styles.benefitItem}>
              <MaterialIcons name={benefit.icon} size={20} color={palette.kimitoBlue} />
              <Text style={styles.benefitText}>{benefit.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ctaBlock}>
          <KimitoLoginCta
            signInHref={SIGN_IN_HREF}
            onPress={() => openLoginGuide({ returnTo: "/" })}
          />
          <Text style={styles.ctaNote}>無料・1タップ / 新規登録もこちら</Text>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="kimito.link 公式の紹介ページ"
          onPress={() => {
            if (Platform.OS === "web" && typeof window !== "undefined") {
              window.location.assign(MARKETING_URL);
              return;
            }
          }}
          style={styles.marketingLink}
        >
          <Text style={styles.marketingLinkText}>kimito.link 公式の紹介ページ</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.kimitoBg,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  heroSub: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginTop: 12,
  },
  previewWrap: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  ctaNote: {
    color: color.textHint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  benefits: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  benefitItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  benefitText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  ctaBlock: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginTop: 2,
  },
  marketingLink: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  marketingLinkText: {
    color: color.textHint,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
