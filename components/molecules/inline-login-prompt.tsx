import { usePathname } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { buildSignInAutoXHref } from "@/lib/clerk-route";
import { color, palette } from "@/theme/tokens";

type InlineLoginPromptBenefit = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

type InlineLoginPromptProps = {
  headline: string;
  returnTo?: string;
  benefits?: InlineLoginPromptBenefit[];
};

const DEFAULT_BENEFITS: InlineLoginPromptBenefit[] = [
  { icon: "place", label: "足あと" },
  { icon: "groups", label: "すれ違い" },
  { icon: "ios-share", label: "X連携" },
];

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function InlineLoginPrompt({
  headline,
  returnTo,
  benefits = DEFAULT_BENEFITS,
}: InlineLoginPromptProps) {
  const pathname = usePathname();
  const openLoginGuide = useLoginGuide();
  const resolvedReturnTo = returnTo ?? normalizeReturnTo(pathname);

  return (
    <View style={styles.wrap}>
      <Text style={styles.headline}>{headline}</Text>
      <View style={styles.benefits}>
        {benefits.slice(0, 3).map((benefit) => (
          <View key={benefit.label} style={styles.benefit}>
            <MaterialIcons
              name={benefit.icon}
              size={18}
              color={palette.kimitoBlue}
            />
            <Text style={styles.benefitText} numberOfLines={1}>
              {benefit.label}
            </Text>
          </View>
        ))}
      </View>
      <KimitoLoginCta
        signInHref={buildSignInAutoXHref(resolvedReturnTo)}
        onPress={() => openLoginGuide({ returnTo: resolvedReturnTo })}
      />
      <Text style={styles.note}>無料・1タップ / 新規登録もこちら</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: 12,
    paddingVertical: 14,
  },
  headline: {
    color: color.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  benefits: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  benefit: {
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
  note: {
    color: color.textHint,
    fontSize: 12,
    textAlign: "center",
  },
});
