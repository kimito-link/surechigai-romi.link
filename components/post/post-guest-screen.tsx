/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP: BrandTagline + CTA 見出しを初回 paint で同期描画（lazy/defer しない）。
 * 帯域譲渡: AppHeader / BrandStamp / benefits+CTA は idle 後 chunk。
 */
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { scheduleAfterIdle } from "@/lib/schedule-after-idle";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { color, palette } from "@/theme/tokens";
import {
  GuestHomeDeferredBody,
  GuestHomeDeferredHeader,
} from "@/components/post/guest-home-deferred-chrome";
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
  const { isDesktop } = useResponsive();
  const tabInset = useTabBarInset();
  const [showDeferred, setShowDeferred] = useState(false);

  useEffect(() => {
    return scheduleAfterIdle(() => setShowDeferred(true), {
      fallbackDelayMs: 200,
      timeoutMs: 2_500,
    });
  }, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      {showDeferred ? (
        <GuestHomeDeferredHeader isDesktop={isDesktop} />
      ) : (
        <View style={styles.headerStub} />
      )}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <BrandTagline compact={false} align="center" lcpProminent />
          <Text style={styles.heroSub}>移動の足あとを残して、すれ違いと聖地巡礼を</Text>
        </View>
        <View style={styles.ctaCard}>
          <Text style={styles.ctaHeadline}>{LCP_HEADLINE}</Text>
          {showDeferred ? <GuestHomeDeferredBody benefits={GUEST_HOME_BENEFITS} /> : null}
        </View>
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
    paddingVertical: 16,
  },
  heroSub: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginTop: 12,
  },
  ctaCard: {
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: "#00427B22",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  ctaHeadline: {
    color: palette.kimitoBlue,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
});
