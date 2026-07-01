/**
 * LoginPreviewBanner の benefits + CTA 部分（MaterialIcons / Link 含む）。
 * ゲストホーム LCP 後に lazy load する想定。
 */
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePathname } from "expo-router";
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { buildSignInHref } from "@/lib/clerk-route";
import { useAuth } from "@/hooks/use-auth";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";

export type LoginPreviewBenefit = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function LoginPreviewBannerExtras({
  benefits,
}: {
  benefits: LoginPreviewBenefit[];
}) {
  const pathname = usePathname();
  const signInHref = buildSignInHref(normalizeReturnTo(pathname));
  const { login } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  const handleNativeLogin = async () => {
    setIsStarting(true);
    try {
      await login(normalizeReturnTo(pathname));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <View style={styles.benefits}>
        {benefits.map((b) => (
          <View key={b.label} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <MaterialIcons name={b.icon} size={15} color={palette.kimitoOrange} />
            </View>
            <Text style={styles.benefitText}>{b.label}</Text>
          </View>
        ))}
      </View>
      <KimitoLoginCta signInHref={signInHref} isStarting={isStarting} onPress={() => void handleNativeLogin()} />
      <Text style={styles.note}>無料・1タップ / 新規登録もこちら</Text>
    </>
  );
}

const styles = StyleSheet.create({
  benefits: {
    gap: 8,
    marginBottom: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  note: {
    color: palette.kimitoInkMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
