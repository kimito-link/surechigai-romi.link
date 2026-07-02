import { usePathname } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { useResponsive } from "@/hooks/use-responsive";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { buildSignInAutoXHref } from "@/lib/clerk-route";
import { color, contentMaxWidth, palette } from "@/theme/tokens";

export type OneTapGuestBenefit = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

type OneTapGuestShellProps = {
  title: string;
  headline: string;
  preview?: React.ReactNode;
  benefits?: readonly [
    OneTapGuestBenefit,
    OneTapGuestBenefit,
    OneTapGuestBenefit,
  ];
  children?: React.ReactNode;
};

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

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function BenefitRow({ benefits }: { benefits: readonly OneTapGuestBenefit[] }) {
  return (
    <View style={styles.benefitRow}>
      {benefits.slice(0, 3).map((benefit) => (
        <View key={benefit.label} style={styles.benefitItem}>
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
}: OneTapGuestShellProps) {
  const { isDesktop } = useResponsive();
  const tabInset = useTabBarInset();
  const pathname = usePathname();
  const openLoginGuide = useLoginGuide();
  const returnTo = normalizeReturnTo(pathname);
  const signInHref = buildSignInAutoXHref(returnTo);
  const handleLogin = () => openLoginGuide({ returnTo });

  const cta = (
    <View style={styles.ctaWrap}>
      <KimitoLoginCta signInHref={signInHref} onPress={handleLogin} />
      <Text style={styles.ctaNote}>無料・1タップ / 新規登録もこちら</Text>
    </View>
  );

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
          styles.content,
          isDesktop && styles.contentDesktop,
          {
            paddingBottom:
              tabInset + (isDesktop ? 24 : FOOTER_ESTIMATED_HEIGHT),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headline}>{headline}</Text>
        {preview ? <View style={styles.previewWrap}>{preview}</View> : null}
        <BenefitRow benefits={benefits} />
        {isDesktop ? cta : null}
        {children}
        <BrandStamp variant="hero" />
      </ScrollView>

      {!isDesktop ? (
        <View
          style={[
            styles.fixedFooter,
            { paddingBottom: Math.max(tabInset - 24, 16) },
          ]}
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
  previewWrap: {
    width: "100%",
    maxWidth: contentMaxWidth.narrow,
    alignSelf: "center",
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
