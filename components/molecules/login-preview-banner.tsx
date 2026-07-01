/**
 * ログイン誘導バナー（プレビュー画面の先頭に置く）
 */
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePathname } from "expo-router";
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { buildSignInHref } from "@/lib/clerk-route";
import { useAuth } from "@/hooks/use-auth";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";

interface Benefit {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const DEFAULT_BENEFITS: Benefit[] = [
  { icon: "place", label: "足あとを正確に残せる" },
  { icon: "groups", label: "通りすがりの人とすれ違える" },
  { icon: "ios-share", label: "現在地をXでシェアできる" },
];

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

interface LoginPreviewBannerProps {
  headline: string;
  benefits?: Benefit[];
}

function BannerBody({
  headline,
  benefits,
  signInHref,
  isStarting,
  onNativeLogin,
}: {
  headline: string;
  benefits: Benefit[];
  signInHref: string;
  isStarting: boolean;
  onNativeLogin?: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.headline}>{headline}</Text>
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
      <KimitoLoginCta signInHref={signInHref} isStarting={isStarting} onPress={onNativeLogin} />
      <Text style={styles.note}>無料・1タップ / 新規登録もこちら</Text>
    </View>
  );
}

export function LoginPreviewBanner({ headline, benefits = DEFAULT_BENEFITS }: LoginPreviewBannerProps) {
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
    <BannerBody
      headline={headline}
      benefits={benefits}
      signInHref={signInHref}
      isStarting={isStarting}
      onNativeLogin={() => void handleNativeLogin()}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: "#00427B22",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headline: {
    color: palette.kimitoBlue,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
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
