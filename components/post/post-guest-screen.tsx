/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP: ヘッダー + タグライン + CTA を初回 paint で同期描画。
 */
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { loginCtaNote } from "@/lib/native-app-shell";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { MARKETING_URL } from "@/lib/site-urls";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/clerk-route";
import { RadarGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { color, palette, touchTarget } from "@/theme/tokens";
import {
  GuestHomeShellHeader,
  GUEST_HOME_HEADER_HEIGHT,
} from "@/components/post/guest-home-shell-header";
import { navigate } from "@/lib/navigation";
import { GuestPlaceContext } from "@/components/molecules/guest-place-context";
import { useWebSideNavActive } from "@/components/organisms/web-side-nav";
import { WEB_APP_FOOTER_HEIGHT } from "@/components/organisms/web-app-footer";

const GUEST_HOME_BENEFITS = [
  {
    icon: "place",
    label: "足あと",
    sub: "正確に残す",
    href: "/(tabs)/checkin" as const,
  },
  {
    icon: "public",
    label: "さがす",
    sub: "みんなの県",
    href: "/(tabs)/zukan" as const,
  },
  {
    icon: "map",
    label: "軌跡",
    sub: "聖地をたどる",
    href: "/(tabs)/map" as const,
  },
] as const;

/** 分割ウィンドウ・タブレット・PC（>= 720px）では2カラムのダッシュボード構成に切り替える */
const SPLIT_LAYOUT_MIN_WIDTH = 720;

export function PostGuestScreen() {
  const tabInset = useTabBarInset();
  const openLoginGuide = useLoginGuide();
  const { width, height } = useWindowDimensions();
  const sideNavActive = useWebSideNavActive();

  const isSplitLayout = width >= SPLIT_LAYOUT_MIN_WIDTH;
  const headerOffset = Platform.OS === "web" ? GUEST_HOME_HEADER_HEIGHT : 0;
  const bottomChrome = sideNavActive ? WEB_APP_FOOTER_HEIGHT + 16 : tabInset;
  const availableHeight = Math.max(480, height - headerOffset - bottomChrome);
  const mobileRadarHeight = Math.max(250, Math.min(340, Math.round(height * 0.36)));

  const benefitCards = (
    <View style={[styles.benefits, isSplitLayout && styles.benefitsSplit]}>
      {GUEST_HOME_BENEFITS.map((benefit) => (
        <Pressable
          key={benefit.label}
          accessibilityRole="button"
          accessibilityLabel={`${benefit.label} — ${benefit.sub}`}
          onPress={() => navigate.toTabPath(benefit.href)}
          style={({ pressed, hovered }) => [
            styles.benefitItem,
            Platform.OS === "web" && (hovered as boolean) && styles.benefitItemHover,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.benefitIconBadge}>
            <MaterialIcons
              name={benefit.icon}
              size={18}
              color={palette.kimitoBlue}
            />
          </View>
          <Text style={styles.benefitText} numberOfLines={1}>
            {benefit.label}
          </Text>
          <Text style={styles.benefitSubText} numberOfLines={1}>
            {benefit.sub}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const ctaSection = (
    <View style={[styles.ctaBlock, isSplitLayout && styles.ctaBlockSplit]}>
      <KimitoLoginCta
        signInHref={SIGN_IN_AUTO_X_HREF}
        onPress={() => openLoginGuide({ returnTo: "/" })}
      />
      <Text style={styles.ctaNote}>{loginCtaNote()}</Text>
    </View>
  );

  const marketingLinkNode = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="kimito.link 公式の紹介ページ"
      onPress={() => {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.location.assign(MARKETING_URL);
          return;
        }
      }}
      style={[styles.marketingLink, isSplitLayout && styles.marketingLinkSplit]}
    >
      <Text style={styles.marketingLinkText}>
        kimito.link 公式の紹介ページ
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <GuestHomeShellHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerOffset + (isSplitLayout ? 16 : 10),
            paddingBottom: bottomChrome,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isSplitLayout ? (
          <View style={[styles.splitContainer, { minHeight: availableHeight - 24 }]}>
            <View
              style={styles.splitMapPane}
              testID="guest-home-radar-preview"
            >
              <RadarGuestPreview />
            </View>
            <View style={styles.splitSidePane}>
              <View style={styles.heroSplit}>
                <View style={styles.kickerPill}>
                  <View style={styles.kickerDot} />
                  <Text style={styles.kickerText}>現在地でつながる、すれ違ひ通信</Text>
                </View>
                <BrandTagline compact={false} align="left" lcpProminent />
                <Text style={styles.heroSubSplit}>
                  移動の足あとを正確な場所として残し、後から思い出と聖地巡礼をたどる位置情報アプリ
                </Text>
              </View>
              {ctaSection}
              {benefitCards}
              <View style={styles.specStrip}>
                <View style={styles.specRow}>
                  <MaterialIcons name="gps-fixed" size={14} color={palette.kimitoBlue} />
                  <Text style={styles.specText}>生座標 + H3 r8 永続保存</Text>
                </View>
                <View style={styles.specRow}>
                  <MaterialIcons name="history" size={14} color={palette.kimitoBlue} />
                  <Text style={styles.specText}>30日タイムシフト交差判定</Text>
                </View>
              </View>
              <GuestPlaceContext />
              {marketingLinkNode}
            </View>
          </View>
        ) : (
          <View style={styles.mobileContainer}>
            <View style={styles.hero}>
              <View style={styles.kickerPill}>
                <View style={styles.kickerDot} />
                <Text style={styles.kickerText}>現在地でつながる、すれ違ひ通信</Text>
              </View>
              <BrandTagline compact={false} align="center" lcpProminent />
              <Text style={styles.heroSub}>
                移動の足あとを残して、すれ違ひと聖地巡礼を
              </Text>
            </View>
            <View
              style={[styles.previewWrap, { height: mobileRadarHeight }]}
              testID="guest-home-radar-preview"
            >
              <RadarGuestPreview />
            </View>
            {ctaSection}
            {benefitCards}
            <GuestPlaceContext />
            {marketingLinkNode}
          </View>
        )}
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
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  mobileContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  splitContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 20,
  },
  splitMapPane: {
    flex: 1.25,
    minWidth: 320,
    minHeight: 420,
    position: "relative",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  splitSidePane: {
    flex: 1,
    maxWidth: 440,
    minWidth: 300,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
    gap: 16,
  },
  kickerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    marginBottom: 8,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.kimitoOrange,
  },
  kickerText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 2,
  },
  heroSplit: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  heroSub: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 360,
    marginTop: 8,
  },
  heroSubSplit: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "left",
    lineHeight: 22,
    marginTop: 10,
  },
  previewWrap: {
    width: "100%",
    minHeight: 240,
    alignSelf: "center",
    position: "relative",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  ctaNote: {
    color: color.textHint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  benefits: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },
  benefitsSplit: {
    marginTop: 2,
  },
  benefitItem: {
    flex: 1,
    minWidth: 0,
    minHeight: touchTarget.minSize,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 2,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  benefitItemHover: {
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlueSoft,
  },
  benefitIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  benefitText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  benefitSubText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  ctaBlock: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  ctaBlockSplit: {
    maxWidth: "100%",
  },
  specStrip: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: palette.kimitoBg,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    gap: 6,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  specText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  marketingLink: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    // 実測 174x36px で HIG 下限を割っていた（2026-08-19 本番実測・375px幅）。
    minHeight: 44,
    justifyContent: "center",
  },
  marketingLinkSplit: {
    alignSelf: "flex-start",
    marginBottom: 0,
  },
  marketingLinkText: {
    color: color.textHint,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
