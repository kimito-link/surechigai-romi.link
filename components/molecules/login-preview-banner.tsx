/**
 * ログイン誘導バナー（プレビュー画面の先頭に置く）
 *
 * Web: Clerk SDK を待たず href で /sign-in へ直行（kimito LpCtaButton 準拠）。
 * Native: useAuth().login() で OAuth フロー。
 */
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, usePathname, type Href } from "expo-router";
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { buildSignInHref } from "@/lib/clerk-route";
import { useAuth } from "@/hooks/use-auth";

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

function LoginCtaButton({
  signInHref,
  isStarting,
  onPress,
}: {
  signInHref: string;
  isStarting: boolean;
  onPress?: () => void;
}) {
  const label = isStarting ? "接続中…" : "ではじめる";

  if (Platform.OS === "web") {
    return (
      <Link href={signInHref as Href} asChild>
        <Pressable
          disabled={isStarting}
          accessibilityRole="button"
          accessibilityLabel={`Xで${label}`}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.85 },
            isStarting && { opacity: 0.65 },
          ]}
        >
          <Text style={styles.xGlyph}>𝕏</Text>
          <Text style={styles.buttonText}>{label}</Text>
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable
      disabled={isStarting}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Xで${label}`}
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.85 },
        isStarting && { opacity: 0.65 },
      ]}
    >
      <Text style={styles.xGlyph}>𝕏</Text>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
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
      <LoginCtaButton signInHref={signInHref} isStarting={isStarting} onPress={onNativeLogin} />
      <Text style={styles.note}>無料・1タップ / 新規登録もこちら</Text>
    </View>
  );
}

function LoginPreviewBannerWeb({ headline, benefits = DEFAULT_BENEFITS }: LoginPreviewBannerProps) {
  const pathname = usePathname();
  const signInHref = buildSignInHref(normalizeReturnTo(pathname));
  return (
    <BannerBody headline={headline} benefits={benefits} signInHref={signInHref} isStarting={false} />
  );
}

function LoginPreviewBannerNative({ headline, benefits = DEFAULT_BENEFITS }: LoginPreviewBannerProps) {
  const { login } = useAuth();
  const pathname = usePathname();
  const [isStarting, setIsStarting] = useState(false);
  const signInHref = buildSignInHref(normalizeReturnTo(pathname));

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

export function LoginPreviewBanner(props: LoginPreviewBannerProps) {
  if (Platform.OS === "web") {
    return <LoginPreviewBannerWeb {...props} />;
  }
  return <LoginPreviewBannerNative {...props} />;
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
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.black,
    paddingVertical: 13,
    borderRadius: 999,
  },
  xGlyph: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "900",
  },
  buttonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "800",
  },
  note: {
    color: palette.kimitoInkMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});
