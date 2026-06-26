/**
 * ログアウト画面
 *
 * kimito.link のログアウト体験を移植し、見た目・文言・演出をまったく同じにする。
 * - 処理中/エラー: kimitolink-linktree/components/LogoutExperience.tsx
 * - 完了:          kimitolink-linktree/app/(auth)/logout/success/page.tsx
 * ボタンの遷移先だけ surechigai 用（自サービス内で再ログイン / トップへ）に配線する。
 */
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState, useEffect, useCallback, useRef } from "react";
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
const LOGOUT_TIMEOUT_MS = 8000;

type LogoutStatus = "working" | "error" | "success";

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

/** kimito の border-t スピナーと同じ青リング。 */
function SpinnerRing() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} accessibilityLabel="処理中" />
  );
}

export default function LogoutScreen() {
  const { logout, isAuthenticated, isAuthReady } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [status, setStatus] = useState<LogoutStatus>("working");
  const startedRef = useRef(false);

  const runLogout = useCallback(async () => {
    setStatus("working");
    try {
      await Promise.race([
        logout(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("logout timed out")), LOGOUT_TIMEOUT_MS),
        ),
      ]);
      setStatus("success");
    } catch (error) {
      console.error("Logout error:", error);
      startedRef.current = false;
      setStatus("error");
    }
  }, [logout]);

  // 認証状態が確定したら自動でログアウトを開始（既にログアウト済みなら完了表示へ）
  useEffect(() => {
    if (!isAuthReady) return;
    if (startedRef.current) return;
    startedRef.current = true;
    if (!isAuthenticated) {
      setStatus("success");
      return;
    }
    void runLogout();
  }, [isAuthReady, isAuthenticated, runLogout]);

  const handleRetry = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runLogout();
  };

  const handleXLogin = () => openLoginGuide({ returnTo: "/", mode: "same" });

  const kicker =
    status === "success" ? "またね〜" : status === "error" ? "少しだけ待ってね" : "また会おうね〜";
  const title =
    status === "success"
      ? "ログアウトしました"
      : status === "error"
        ? "ログアウトを完了できませんでした"
        : "ログアウトしています";

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

            <Text style={styles.kicker}>{kicker}</Text>
            <Text style={styles.title}>{title}</Text>

            {status === "success" && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
            {status === "working" && (
              <View style={{ marginTop: 24 }}>
                <SpinnerRing />
              </View>
            )}

            <Text style={styles.description}>
              {status === "success"
                ? "X アカウントとの接続を安全に終了しました。\n作成したプロフィールやリンクは保存されています。"
                : status === "error"
                  ? "通信が一時的に不安定です。もう一度お試しください。"
                  : "安全にセッションを終了しています。通常はすぐに完了します。"}
            </Text>

            {status === "success" && (
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

            {status === "error" && (
              <View style={styles.buttons}>
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
                >
                  <Text style={styles.btnXText}>もう一度試す</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigateReplace.toHomeRoot()}
                  style={({ pressed }) => [styles.btnTop, pressed && styles.pressed]}
                >
                  <Text style={styles.btnTopText}>トップへ戻る</Text>
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
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: CARD_BORDER,
    borderTopColor: palette.kimitoBlue,
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
  btnPrimary: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.kimitoBlue,
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
