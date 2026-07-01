/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP: ヘッダー + タグライン + CTA を初回 paint で同期描画。
 */
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from "react-native";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { MARKETING_URL } from "@/lib/site-urls";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { SIGN_IN_HREF } from "@/lib/clerk-route";
import {
  GuestHomeShellHeader,
  GUEST_HOME_HEADER_HEIGHT,
} from "@/components/post/guest-home-shell-header";

const GUEST_HOME_BENEFITS = [
  "足あとを正確に残し、あとから地図でたどる",
  "保存した場所へ「ここへ向かう」でナビ",
  "通りすがりの人とすれ違い、封筒が届く",
  "集まりの予定を見て、ライブ表明もできる",
  "みんなの現在地を都道府県マップで確認",
] as const;

const LCP_HEADLINE = "ログインして、封筒と足あとを受け取ろう";

export function PostGuestScreen() {
  const tabInset = useTabBarInset();

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
        <View style={styles.ctaCard}>
          <Text style={styles.ctaHeadline}>{LCP_HEADLINE}</Text>
          <KimitoLoginCta signInHref={SIGN_IN_HREF} />
          <Text style={styles.ctaNote}>無料・1タップ / 新規登録もこちら</Text>
          <View style={styles.benefits}>
            {GUEST_HOME_BENEFITS.map((label) => (
              <View key={label} style={styles.benefitRow}>
                <Text style={styles.bullet} accessibilityElementsHidden>
                  •
                </Text>
                <Text style={styles.benefitText}>{label}</Text>
              </View>
            ))}
          </View>
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
    backgroundColor: "#F0F4F8",
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
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginTop: 12,
  },
  ctaCard: {
    backgroundColor: "#E8F2FA",
    borderWidth: 1,
    borderColor: "#00427B22",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  ctaHeadline: {
    color: "#00427B",
    fontSize: 16,
    fontWeight: "800",
  },
  ctaNote: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
  },
  benefits: {
    gap: 8,
    marginTop: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    width: 12,
  },
  benefitText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  marketingLink: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  marketingLinkText: {
    color: "#64748B",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
