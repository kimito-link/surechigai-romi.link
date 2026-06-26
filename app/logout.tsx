/**
 * ログアウト画面
 *
 * kimito.link の /logout/success ページのソースを移植し、見た目・文言・体験を
 * まったく同じにする（出典: kimitolink-linktree/app/(auth)/logout/success/page.tsx）。
 * ボタンの遷移先だけ surechigai 用（自サービス内で再ログイン / トップへ）に配線する。
 */
import { Text, View, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";

const LINK_CHARACTER = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

// kimito ブランドの不透明度付きライン色
const CARD_BORDER = "#00427B26"; // kimitoBlue 15%

/** X(旧Twitter) ロゴ。kimito の success ページと同一のパス。 */
function XGlyph({ size = 16, fill = palette.white }: { size?: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={fill}
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </Svg>
  );
}

export default function LogoutScreen() {
  const { logout, isAuthenticated } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutComplete(true);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);

  // マウント時に自動ログアウト
  useEffect(() => {
    if (isAuthenticated && !logoutComplete && !isLoggingOut) {
      handleLogout();
    }
  }, [isAuthenticated, handleLogout, isLoggingOut, logoutComplete]);

  const handleXLogin = () => openLoginGuide({ returnTo: "/", mode: "same" });

  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
      <AppHeader />

      <View style={styles.center}>
        <View style={styles.card}>
          <LinearGradient
            colors={[palette.kimitoBlueSoft, palette.white, "#FFF7ED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardInner}
          >
            <Image source={LINK_CHARACTER} style={styles.character} contentFit="contain" />

            <Text style={styles.kicker}>またね〜</Text>
            <Text style={styles.title}>
              {logoutComplete ? "ログアウトしました" : "ログアウトしています"}
            </Text>

            {logoutComplete ? (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            ) : (
              <ActivityIndicator size="small" color={palette.kimitoBlue} style={{ marginTop: 20 }} />
            )}

            <Text style={styles.description}>
              X アカウントとの接続を安全に終了しました。{"\n"}
              作成したプロフィールやリンクは保存されています。
            </Text>

            {logoutComplete && (
              <View style={styles.buttons}>
                <Pressable
                  onPress={handleXLogin}
                  style={({ pressed }) => [styles.btnX, pressed && styles.pressed]}
                >
                  <XGlyph size={16} />
                  <Text style={styles.btnXText}>X でログインする</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigateReplace.toHomeRoot()}
                  style={({ pressed }) => [styles.btnTop, pressed && styles.pressed]}
                >
                  <Text style={styles.btnTopText}>トップページへ</Text>
                </Pressable>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 48,
  },
  card: {
    width: "100%",
    maxWidth: 448,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: palette.white,
    overflow: "hidden",
    shadowColor: palette.kimitoBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
  },
  cardInner: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  character: {
    width: 160,
    height: 160,
  },
  kicker: {
    marginTop: 8,
    color: palette.kimitoOrange,
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    marginTop: 8,
    color: palette.kimitoBlue,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  checkCircle: {
    marginTop: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#047857",
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    marginTop: 16,
    color: "#334155",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
  },
  buttons: {
    marginTop: 28,
    width: "100%",
    gap: 12,
  },
  btnX: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.black,
    paddingHorizontal: 20,
  },
  btnXText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "700",
  },
  btnTop: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00427B33",
    backgroundColor: palette.white,
    paddingHorizontal: 20,
  },
  btnTopText: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
