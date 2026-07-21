import { usePathname } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { getTabHeaderSpacerHeight } from "@/components/organisms/tab-header-spacer";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { useResponsive } from "@/hooks/use-responsive";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { buildSignInAutoXHref } from "@/lib/clerk-route";
import { color, palette } from "@/theme/tokens";
import { WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";

export type OneTapGuestBenefit = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

/**
 * ヒーロー地図ペインの実測幅。onLayout（ResizeObserverベース）はSuspense境界を
 * 挟む構成で発火しないことが実機確認で判明したため、preview側で幅追従の描画
 * （JapanBlockMapのavailableWidth等）が必要な場合はrender prop形式で受け取れるようにする。
 * 単純な要素(<CheckinGuestPreview />等)を渡す既存の使い方は変更不要。
 */
type OneTapGuestPreview = React.ReactNode | ((heroMapWidth: number) => React.ReactNode);

type OneTapGuestShellProps = {
  title: string;
  headline: string;
  preview?: OneTapGuestPreview;
  benefits?: readonly [
    OneTapGuestBenefit,
    OneTapGuestBenefit,
    OneTapGuestBenefit,
  ];
  children?: React.ReactNode;
  /**
   * デスクトップ2ペイン時の右パネル幅（既定 HERO_DESKTOP_PANEL_WIDTH=360）。
   * 地図ペインを広く取りたい画面（zukan）で上書きする。
   */
  heroPanelWidth?: number;
};

function renderPreview(preview: OneTapGuestPreview | undefined, heroMapWidth: number) {
  return typeof preview === "function" ? preview(heroMapWidth) : preview;
}

const DEFAULT_BENEFITS: readonly [
  OneTapGuestBenefit,
  OneTapGuestBenefit,
  OneTapGuestBenefit,
] = [
  { icon: "place", label: "足あと" },
  { icon: "groups", label: "すれ違い" },
  { icon: "ios-share", label: "X連携" },
];

const FOOTER_ESTIMATED_HEIGHT = 104;
const HERO_MIN_HEIGHT = 320;
const HERO_DESKTOP_PANEL_WIDTH = 360;

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function BenefitRow({
  benefits,
  overlay = false,
}: {
  benefits: readonly OneTapGuestBenefit[];
  overlay?: boolean;
}) {
  return (
    <View style={styles.benefitRow}>
      {benefits.slice(0, 3).map((benefit) => (
        <View
          key={benefit.label}
          style={[styles.benefitItem, overlay && styles.benefitItemOverlay]}
        >
          <MaterialIcons
            name={benefit.icon}
            size={20}
            color={palette.kimitoBlue}
          />
          <Text style={styles.benefitLabel} numberOfLines={1}>
            {benefit.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function OneTapGuestShell({
  title,
  headline,
  preview,
  benefits = DEFAULT_BENEFITS,
  children,
  heroPanelWidth = HERO_DESKTOP_PANEL_WIDTH,
}: OneTapGuestShellProps) {
  const { width, height, isDesktop } = useResponsive();
  const tabInset = useTabBarInset();
  const pathname = usePathname();
  const openLoginGuide = useLoginGuide();
  const { user, isAuthReadyForUI } = useAuth();
  const returnTo = normalizeReturnTo(pathname);
  const signInHref = buildSignInAutoXHref(returnTo);
  const handleLogin = () => openLoginGuide({ returnTo });
  const [footerHeight, setFooterHeight] = useState(FOOTER_ESTIMATED_HEIGHT);

  const isHero = Boolean(preview);
  const hasLoginButtonRow = Boolean(isAuthReadyForUI && !user);
  const headerSpacerHeight = getTabHeaderSpacerHeight({
    variant: "compact",
    windowWidth: width,
    hasLoginButtonRow,
  });
  const footerBottomInset = Math.max(tabInset - 24, 16);
  const heroMinHeight = Math.max(
    HERO_MIN_HEIGHT,
    height -
      headerSpacerHeight -
      (isDesktop ? 0 : footerHeight + footerBottomInset),
  );
  // isDesktop(width>=1024)は必ずサイドバー表示条件(width>=900)を満たすため、
  // サイドバー分は確実に引ける。heroPanelの borderLeftWidth(1px) も差し引く。
  const heroMapWidth = isDesktop
    ? Math.max(0, width - WEB_SIDE_NAV_WIDTH - heroPanelWidth - 1)
    : width;

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.height);
    if (measured > 0 && measured !== footerHeight) setFooterHeight(measured);
  };

  const cta = (
    <View style={styles.ctaWrap}>
      <KimitoLoginCta signInHref={signInHref} onPress={handleLogin} />
      <Text style={styles.ctaNote}>無料・1タップ / 新規登録もこちら</Text>
    </View>
  );

  const headlineNode = (
    <Text style={isHero ? styles.headlineOverlay : styles.headline}>
      {headline}
    </Text>
  );
  const benefitsNode = <BenefitRow benefits={benefits} />;
  const benefitsOverlayNode = <BenefitRow benefits={benefits} overlay />;

  return (
    <ScreenContainer containerClassName="bg-background" style={styles.root}>
      <TabScreenHeader
        title={title}
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
        showLoginButton
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          !isHero && styles.content,
          !isHero && isDesktop && styles.contentDesktop,
          {
            paddingBottom:
              tabInset + (isDesktop ? 24 : footerHeight),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isHero ? (
          isDesktop ? (
            <View style={[styles.heroRow, { minHeight: heroMinHeight }]}>
              <View style={styles.heroMap}>{renderPreview(preview, heroMapWidth)}</View>
              <View style={[styles.heroPanel, { width: heroPanelWidth }]}>
                <Text style={styles.headline}>{headline}</Text>
                {benefitsNode}
                {cta}
              </View>
            </View>
          ) : (
            <View style={[styles.hero, { minHeight: heroMinHeight }]}>
              {renderPreview(preview, heroMapWidth)}
              <View style={styles.heroOverlayTop}>
                <View style={styles.headlinePanel}>{headlineNode}</View>
              </View>
              <View style={styles.heroOverlayBottom}>{benefitsOverlayNode}</View>
            </View>
          )
        ) : (
          <>
            <Text style={styles.headline}>{headline}</Text>
            {benefitsNode}
            {isDesktop ? cta : null}
          </>
        )}
        <View style={isHero ? styles.belowFold : undefined}>
          {children}
          <BrandStamp variant="hero" />
        </View>
      </ScrollView>

      {!isDesktop ? (
        <View
          style={[styles.fixedFooter, { paddingBottom: footerBottomInset }]}
          onLayout={handleFooterLayout}
        >
          {cta}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  contentDesktop: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  headline: {
    color: color.textPrimary,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
  },
  headlineOverlay: {
    color: color.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  hero: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  heroOverlayTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
  },
  headlinePanel: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  heroOverlayBottom: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
  },
  heroRow: {
    flexDirection: "row",
    width: "100%",
  },
  heroMap: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    overflow: "hidden",
  },
  heroPanel: {
    borderLeftWidth: 1,
    borderLeftColor: palette.kimitoBorderSoft,
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  belowFold: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 2,
  },
  benefitItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  benefitItemOverlay: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  benefitLabel: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  ctaWrap: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  ctaNote: {
    marginTop: 6,
    color: color.textHint,
    fontSize: 12,
    textAlign: "center",
  },
  fixedFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: palette.kimitoBg,
    borderTopWidth: 1,
    borderTopColor: palette.kimitoBorderSoft,
  },
});
