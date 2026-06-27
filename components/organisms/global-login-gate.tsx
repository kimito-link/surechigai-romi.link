import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { color, palette } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "expo-router";
import { useMemo, useState } from "react";

interface GlobalLoginGateProps {
  title: string;
  subtitle?: string;
  headerTitle: string;
  isDesktop?: boolean;
}

const BLUE_BORDER = "#00427B33"; // kimitoBlue 20%

// ログインで得られる価値（ロック画面でも「入りたくなる」よう提示）。
const GATE_BENEFITS = [
  { icon: "place" as const, label: "足あとを正確に残して、あとでその場所に行ける" },
  { icon: "groups" as const, label: "同じ場所を通った人とすれ違える" },
  { icon: "ios-share" as const, label: "現在地をXでシェアして思い出を残せる" },
];

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function GlobalLoginGate({
  title,
  subtitle,
  headerTitle,
  isDesktop = false,
}: GlobalLoginGateProps) {
  const { login } = useAuth();
  const pathname = usePathname();
  const returnTo = useMemo(() => normalizeReturnTo(pathname), [pathname]);
  const [isStartingLogin, setIsStartingLogin] = useState(false);

  const handleLogin = async () => {
    setIsStartingLogin(true);
    try {
      await login(returnTo);
    } finally {
      setIsStartingLogin(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title={(headerTitle || "君斗りんくのすれ違ひ通信")}
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={true}
      />

      <View style={styles.container}>
        {/* Characters */}
        <View style={styles.charactersContainer}>
          <Image
            source={require("@/assets/images/characters/tanune.png")}
            style={[styles.characterImage, styles.tanune]}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/characters/rinku.png")}
            style={[styles.characterImage, styles.rinku]}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/characters/konta.png")}
            style={[styles.characterImage, styles.konta]}
            resizeMode="contain"
          />
        </View>

        {/* ログイン案内カード（kimito.link と同じ白基調ブランド） */}
        <View style={styles.authCard}>
          <View style={styles.cardBody}>
            <View style={styles.lockBadge}>
              <MaterialIcons name="lock-outline" size={28} color={palette.kimitoBlue} />
            </View>
            <Text style={styles.titleText}>{title}</Text>
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}

            <View style={styles.divider} />

            {/* ログインで何ができるか（ベネフィット） */}
            <View style={styles.benefits}>
              {GATE_BENEFITS.map((b) => (
                <View key={b.label} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <MaterialIcons name={b.icon} size={16} color={palette.kimitoOrange} />
                  </View>
                  <Text style={styles.benefitText}>{b.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.introText}>
              姉妹サービス kimito.link と同じXログインで、すぐにはじめられます。{"\n"}
              認証後はこのアプリへ戻ります。
            </Text>

            <Pressable
              disabled={isStartingLogin}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                isStartingLogin && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
            >
              <MaterialIcons name="login" size={20} color={palette.white} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>
                {isStartingLogin ? "接続中..." : "Xログインへ進む"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: color.bg,
  },
  charactersContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 120,
    marginBottom: -20,
    zIndex: 10,
    width: "100%",
  },
  characterImage: {
    width: 100,
    height: 120,
  },
  rinku: {
    width: 120,
    height: 140,
    zIndex: 3,
  },
  tanune: {
    zIndex: 1,
    marginRight: -30,
    transform: [{ rotate: "-10deg" }],
  },
  konta: {
    zIndex: 2,
    marginLeft: -30,
    transform: [{ rotate: "10deg" }],
  },
  authCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: palette.white,
    borderColor: BLUE_BORDER,
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: palette.kimitoBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    zIndex: 20,
    overflow: "hidden",
    marginBottom: 40,
  },
  cardBody: {
    padding: 24,
  },
  lockBadge: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  titleText: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    color: palette.kimitoInkMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: palette.kimitoBorderSoft,
    marginVertical: 16,
  },
  benefits: {
    gap: 12,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  introText: {
    color: palette.kimitoInkMuted,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: palette.black,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "bold",
  },
});
