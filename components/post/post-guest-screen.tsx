/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP: ヘッダー + タグライン + CTA を初回 paint で同期描画。
 * benefits（MaterialIcons）は idle 後 chunk。
 */
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { scheduleAfterIdle } from "@/lib/schedule-after-idle";
import { MARKETING_URL } from "@/lib/site-urls";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { SIGN_IN_HREF } from "@/lib/clerk-route";
import {
  GuestHomeDeferredBenefits,
  GUEST_HOME_BENEFITS_PLACEHOLDER_HEIGHT,
} from "@/components/post/guest-home-deferred-chrome";
import {
  GuestHomeShellHeader,
  GUEST_HOME_HEADER_HEIGHT,
} from "@/components/post/guest-home-shell-header";
import type { LoginPreviewBenefit } from "@/components/molecules/login-preview-banner-extras";

const GUEST_HOME_BENEFITS: LoginPreviewBenefit[] = [
  { icon: "place", label: "足あとを正確に残し、あとから地図でたどる" },
  { icon: "navigation", label: "保存した場所へ「ここへ向かう」でナビ" },
  { icon: "groups", label: "通りすがりの人とすれ違い、封筒が届く" },
  { icon: "calendar-today", label: "集まりの予定を見て、ライブ表明もできる" },
  { icon: "map", label: "みんなの現在地を都道府県マップで確認" },
];

const LCP_HEADLINE = "ログインして、封筒と足あとを受け取ろう";

export function PostGuestScreen() {
  const tabInset = useTabBarInset();
  const [showBenefits, setShowBenefits] = useState(false);

  useEffect(() => {
    return scheduleAfterIdle(() => setShowBenefits(true), {
      fallbackDelayMs: 800,
      timeoutMs: 4_000,
    });
  }, []);

  const headerOffset =
    Platform.OS === "web" ? GUEST_HOME_HEADER_HEIGHT : 0;

  return (
    <View style={styles.root}>
      <GuestHomeShellHeader />
      <ScrollView
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
          {showBenefits ? (
            <GuestHomeDeferredBenefits benefits={GUEST_HOME_BENEFITS} />
          ) : (
            <View style={styles.benefitsPlaceholder} />
          )}
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
  benefitsPlaceholder: {
    height: GUEST_HOME_BENEFITS_PLACEHOLDER_HEIGHT,
    width: "100%",
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
