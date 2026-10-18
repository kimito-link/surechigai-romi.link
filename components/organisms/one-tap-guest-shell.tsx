import { usePathname } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { loginCtaNote } from "@/lib/native-app-shell";
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
import { useWebSideNavActive, WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";

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
type OneTapGuestPreview =
  | React.ReactNode
  | ((heroMapWidth: number, layout: OneTapGuestPreviewLayout) => React.ReactNode);

/**
 * ヒーロー内の並べ方。stacked=true は、見出しと追加要素(heroExtra)が地図の「上」に積まれ、
 * 地図の上端に見出しが重ならない配置（地図側が見出し用に空けていた余白は不要）。
 */
export type OneTapGuestPreviewLayout = { stacked: boolean };

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
   * ファーストビュー（ヒーロー領域）の中に出す追加要素。
   *
   * ★2026-08-17: children は belowFold に置かれるため、実測で 783px＝画面外だった。
   * 「機能はあるが気づかれない」を繰り返さないよう、見出しの直下に出す口を分けた。
   */
  heroExtra?: React.ReactNode;
  /**
   * 積み配置（heroExtra あり・モバイル）での、追加要素の位置。
   *   "above"（既定）: 見出しの直下、地図の上。
   *   "below"       : 地図の下。地図が主役の画面（/zukan）で、地図を最初の画面に出すため。
   */
  heroExtraPlacement?: "above" | "below";
  /**
   * デスクトップ2ペイン時の右パネル幅（既定 HERO_DESKTOP_PANEL_WIDTH=360）。
   * 地図ペインを広く取りたい画面（zukan）で上書きする。
   */
  heroPanelWidth?: number;
};

function renderPreview(
  preview: OneTapGuestPreview | undefined,
  heroMapWidth: number,
  stacked = false,
) {
  return typeof preview === "function" ? preview(heroMapWidth, { stacked }) : preview;
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
/**
 * ★2026-10-18: 320 → 420。地図の上に重ねる要素（ピン・下のカード・下のボタン列）は、
 * それぞれ「ヒーローの高さに対する割合」や「下から◯px」で置かれている。高さが足りない
 * 短い画面（iPhone SE 相当）では、これらが互いにぶつかって文字が隠れた（本番の実測）。
 * 重ならない最小の高さを確保する。足りない分は画面を縦にスクロールして見られる。
 */
const HERO_MIN_HEIGHT = 420;
/** 積み配置（heroExtra あり）のとき、見出しの下に確保する地図部分の最小の高さ。 */
const STACK_PREVIEW_MIN_HEIGHT = 420;
const HERO_DESKTOP_PANEL_WIDTH = 360;
const SPLIT_HERO_MIN_WIDTH = 768;

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
  heroExtra,
  heroExtraPlacement = "above",
  heroPanelWidth = HERO_DESKTOP_PANEL_WIDTH,
}: OneTapGuestShellProps) {
  const { width, height, isDesktop } = useResponsive();
  const sideNavActive = useWebSideNavActive();
  const tabInset = useTabBarInset();
  const pathname = usePathname();
  const openLoginGuide = useLoginGuide();
  const { user, isAuthReadyForUI } = useAuth();
  const returnTo = normalizeReturnTo(pathname);
  const signInHref = buildSignInAutoXHref(returnTo);
  const handleLogin = () => openLoginGuide({ returnTo });
  const [footerHeight, setFooterHeight] = useState(FOOTER_ESTIMATED_HEIGHT);

  const isHero = Boolean(preview);
  const isSplitHero = isDesktop || width >= SPLIT_HERO_MIN_WIDTH;
  const effectivePanelWidth =
    !isDesktop && isSplitHero ? Math.min(heroPanelWidth, 300) : heroPanelWidth;
  const sideNavOffset = sideNavActive ? WEB_SIDE_NAV_WIDTH : 0;

  const hasLoginButtonRow = Boolean(!user);
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
      (isSplitHero ? 0 : footerHeight + footerBottomInset),
  );
  // サイドバー分（sideNavActive時）と heroPanel の borderLeftWidth(1px) を差し引く。
  const heroMapWidth = isSplitHero
    ? Math.max(0, width - sideNavOffset - effectivePanelWidth - 1)
    : Math.max(0, width - sideNavOffset);

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.height);
    if (measured > 0 && measured !== footerHeight) setFooterHeight(measured);
  };

  const cta = (
    <View style={styles.ctaWrap}>
      <KimitoLoginCta signInHref={signInHref} onPress={handleLogin} />
      <Text style={styles.ctaNote}>{loginCtaNote()}</Text>
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
          !isHero && isSplitHero && styles.contentDesktop,
          {
            paddingBottom:
              tabInset + (isSplitHero ? 24 : footerHeight),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isHero ? (
          isSplitHero ? (
            <View style={[styles.heroRow, { minHeight: heroMinHeight }]}>
              <View style={styles.heroMap}>{renderPreview(preview, heroMapWidth)}</View>
              <View style={[styles.heroPanel, { width: effectivePanelWidth }]}>
                <Text style={styles.headline}>{headline}</Text>
                {benefitsNode}
                {heroExtra ? <View style={styles.heroExtra}>{heroExtra}</View> : null}
                {cta}
              </View>
            </View>
          ) : heroExtra ? (
            /* ★2026-10-18: 追加要素(天気・ライブカメラ)があるときは、見出し→追加要素→地図の順に
               **上から積む**。以前は見出しと追加要素を地図の上に position:absolute で浮かせていたため、
               追加要素の高さ(約130px)の分だけ地図の上端と重なり、都道府県のタイルや
               下のカードが隠れた（本番の /zukan・/map で実測）。
               追加要素は見出しの直下＝ファーストビュー内、という 2026-08-17 の要件は保つ。 */
            <View style={[styles.heroStacked, { minHeight: heroMinHeight }]}>
              <View style={styles.heroStackTop}>
                <View style={styles.headlinePanel}>{headlineNode}</View>
                {heroExtraPlacement === "above" ? (
                  <View style={styles.heroExtra}>{heroExtra}</View>
                ) : null}
              </View>
              <View style={styles.heroStackPreview}>
                {renderPreview(preview, heroMapWidth, true)}
                <View style={styles.heroOverlayBottom}>{benefitsOverlayNode}</View>
              </View>
              {heroExtraPlacement === "below" ? (
                <View style={styles.heroStackBottom}>
                  <View style={styles.heroExtra}>{heroExtra}</View>
                </View>
              ) : null}
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
            {isSplitHero ? cta : null}
          </>
        )}
        <View style={isHero ? styles.belowFold : undefined}>
          {children}
          <BrandStamp variant="hero" />
        </View>
      </ScrollView>

      {!isSplitHero ? (
        <View
          // nativeID: App Store スクショ撮影時に隠すためのフック。
          // このフッターはタブバー直上に固定表示されるため、撮影すると
          // 画面下端で途中から切れて写り、見栄えを損なう（2026-08-05 実画像で確認）。
          nativeID="guest-fixed-footer"
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
  /* 積み配置（heroExtra あり）。見出し→追加要素→地図の順に、重ならずに並べる。 */
  heroStacked: {
    width: "100%",
  },
  heroStackTop: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  /* 追加要素を地図の下に置くとき（heroExtraPlacement="below"）の枠。 */
  heroStackBottom: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  heroStackPreview: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    flexGrow: 1,
    minHeight: STACK_PREVIEW_MIN_HEIGHT,
  },
  /* ファーストビュー内に出す追加要素の枠（天気・ライブカメラなど）。
     見出しの直下に置くので、スクロールしなくても目に入る。 */
  heroExtra: {
    width: "100%",
    marginTop: 10,
    alignItems: "center",
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
