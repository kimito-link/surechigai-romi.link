/**
 * BrandStamp — サービス名・Kimito Link ロゴの控えめな露出
 * サイドナビ / フッター / ヒーロー下など、操作を邪魔しない位置専用
 */
import { View, Text, Pressable, StyleSheet, Platform, Linking } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import {
  KIMITO_LINK_LOGO,
  PARENT_BRAND,
  PARENT_BRAND_JA,
  PARENT_PROJECT,
  PARENT_SITE_URL,
  PRODUCT_NAME,
  PRODUCT_NAME_SHORT,
  PRODUCT_SUBTITLE,
  BRAND_CHARACTERS,
} from "@/components/brand/brand-constants";

export type BrandStampVariant = "sideNav" | "sideNavFoot" | "footer" | "hero";

type BrandStampProps = {
  variant: BrandStampVariant;
};

function triggerHaptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function goHome() {
  triggerHaptic();
  navigate.toHome();
}

function openParentSite() {
  triggerHaptic();
  void Linking.openURL(PARENT_SITE_URL);
}

export function BrandStamp({ variant }: BrandStampProps) {
  if (variant === "sideNav") {
    return (
      <Pressable
        onPress={goHome}
        accessibilityRole="link"
        accessibilityLabel={`${PRODUCT_NAME} — ホーム`}
        style={({ pressed, hovered }) => [
          styles.sideNav,
          Platform.OS === "web" && (hovered as boolean) && styles.sideNavHover,
          pressed && styles.pressed,
        ]}
      >
        <Image source={KIMITO_LINK_LOGO} style={styles.sideNavLogo} contentFit="contain" />
        <Text style={styles.sideNavTitle}>{PRODUCT_NAME_SHORT}</Text>
        <Text style={styles.sideNavSubtitle}>{PRODUCT_SUBTITLE}</Text>
      </Pressable>
    );
  }

  if (variant === "sideNavFoot") {
    return (
      <View style={styles.sideNavFoot}>
        <View style={styles.charRow} pointerEvents="none">
          {BRAND_CHARACTERS.map((src, i) => (
            <Image key={i} source={src} style={styles.charIcon} contentFit="contain" />
          ))}
        </View>
        <Pressable
          onPress={openParentSite}
          accessibilityRole="link"
          accessibilityLabel={`${PARENT_BRAND} 公式サイト`}
          style={({ pressed, hovered }) => [
            styles.sideNavFootLink,
            Platform.OS === "web" && (hovered as boolean) && styles.sideNavHover,
            pressed && styles.pressed,
          ]}
        >
          <Image source={KIMITO_LINK_LOGO} style={styles.sideNavFootLogo} contentFit="contain" />
          <Text style={styles.sideNavFootBrand}>{PARENT_BRAND}</Text>
          <Text style={styles.sideNavFootProject}>{PARENT_PROJECT}</Text>
        </Pressable>
      </View>
    );
  }

  if (variant === "footer") {
    return (
      <Pressable
        onPress={goHome}
        accessibilityRole="link"
        accessibilityLabel={PRODUCT_NAME}
        style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
      >
        <Image source={KIMITO_LINK_LOGO} style={styles.footerLogo} contentFit="contain" />
        <Text style={styles.footerText} numberOfLines={1}>
          {PRODUCT_NAME}
        </Text>
      </Pressable>
    );
  }

  // hero — ゲストトップ等、タグライン直下
  return (
    <View style={styles.hero} accessibilityLabel={PRODUCT_NAME}>
      <Image source={KIMITO_LINK_LOGO} style={styles.heroLogo} contentFit="contain" />
      <Text style={styles.heroProduct}>{PRODUCT_NAME}</Text>
      <Text style={styles.heroParent}>
        {PARENT_BRAND_JA} · {PARENT_PROJECT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  sideNav: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    marginBottom: 4,
    borderRadius: 10,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  sideNavHover: {
    backgroundColor: palette.kimitoBlue + "0A",
  },
  sideNavLogo: {
    width: 120,
    height: 32,
    marginBottom: 6,
  },
  sideNavTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: palette.kimitoBlue,
    letterSpacing: 0.2,
  },
  sideNavSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: color.textMuted,
    marginTop: 1,
    letterSpacing: 0.4,
  },
  sideNavFoot: {
    marginTop: "auto" as unknown as number,
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: 8,
  },
  charRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    opacity: 0.85,
  },
  charIcon: {
    width: 26,
    height: 26,
  },
  sideNavFootLink: {
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  sideNavFootLogo: {
    width: 88,
    height: 22,
    marginBottom: 4,
  },
  sideNavFootBrand: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.kimitoBlue,
    letterSpacing: 0.3,
  },
  sideNavFootProject: {
    fontSize: 9,
    color: color.textMuted,
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "48%",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  footerLogo: {
    width: 72,
    height: 18,
    flexShrink: 0,
  },
  footerText: {
    fontSize: 11,
    color: color.textMuted,
    fontWeight: "600",
    flexShrink: 1,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  heroLogo: {
    width: 128,
    height: 34,
    opacity: 0.92,
  },
  heroProduct: {
    fontSize: 11,
    fontWeight: "700",
    color: color.textMuted,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  heroParent: {
    fontSize: 10,
    color: color.textHint,
    textAlign: "center",
  },
});
