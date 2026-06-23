import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color } from "@/theme/tokens";

interface RadarHudProps {
  onDismissIntro?: () => void;
  showIntro?: boolean;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

export function RadarHud({ onDismissIntro, showIntro = true, isAuthenticated, onLogin }: RadarHudProps) {
  const insets = useSafeAreaInsets();
  const [isDismissed, setIsDismissed] = useState(!showIntro);

  if (isDismissed) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 16, zIndex: 100 }]}
      pointerEvents="box-none"
    >
      {/* HERO HEADER: 大タイトル + 読み + キャッチコピー（テキストは選択可能） */}
      <View style={styles.header} pointerEvents="box-none">
        <Image
          source={require("@/assets/images/logos/kimitolink-logo.webp")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text selectable style={styles.heroTitle}>君斗りんくの{"\n"}すれ違ひ通信</Text>
        <Text selectable style={styles.heroReading}>SURECHIGAI TSUSHIN</Text>
        <Text selectable style={styles.catchMain}>会いたい君がいる現在地</Text>
        <Text selectable style={styles.catchSub}>― キミは今、どこにいる？ ―</Text>

        {/* ログインボタン（最優先・キャッチ直下に大きく）。未ログイン時のみ。 */}
        {!isAuthenticated && (
          <Pressable
            style={({ pressed }) => [styles.heroLoginButton, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            onPress={onLogin}
            pointerEvents="auto"
          >
            <Text style={styles.heroLoginText}>𝕏（Twitter）ではじめる</Text>
            <Text style={styles.heroLoginSub}>無料・1タップ / 新規登録もこちら</Text>
          </Pressable>
        )}
      </View>

      {/* INTRO CARD & CHARACTERS */}
      <View style={styles.bottomSection} pointerEvents="box-none">
        
        {/* Characters */}
        <View style={styles.charactersContainer} pointerEvents="none">
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

        {/* Intro Card（ログイン後の「了解／監視を開始」専用。未ログイン時はヒーローのログインボタンで完結）。 */}
        {isAuthenticated && (
          <View style={styles.introCard} pointerEvents="auto">
            <View style={styles.cardHeader}>
              <View style={styles.dotRed} />
              <View style={styles.dotYellow} />
              <View style={styles.dotGreen} />
              <Text style={styles.cardTitle}>SYSTEM / INTRO.exe</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.introText}>
                Kimito-link シグナル傍受システムへようこそ。{"\n"}
                レーダー上の光点（すれちがい）をタップして通信をデコードしろ。
              </Text>

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => {
                  setIsDismissed(true);
                  onDismissIntro?.();
                }}
              >
                <Text style={styles.buttonText}>[ SYSTEM: 了解 / 監視を開始 ]</Text>
              </Pressable>
            </View>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1, // 画面の上半分を占め、その中央にタイトルを大きく置く
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  logo: {
    width: 130,
    height: 44,
    opacity: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#eef4fb",
    fontSize: 60,
    fontWeight: "800",
    lineHeight: 78,
    letterSpacing: 6,
    textAlign: "center",
    marginTop: 8,
    textShadowColor: "rgba(8,16,30,0.95)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 30,
  },
  heroReading: {
    color: "#8fb0d6",
    fontSize: 13,
    letterSpacing: 8,
    marginTop: 14,
    fontFamily: "monospace",
  },
  catchMain: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 32,
    textAlign: "center",
    textShadowColor: color.accentPrimary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  catchSub: {
    color: "#bcd4f0",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },
  heroLoginButton: {
    marginTop: 34,
    minWidth: 280,
    maxWidth: 360,
    width: "86%",
    backgroundColor: color.accentIndigo,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: color.accentIndigo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLoginText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroLoginSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 1,
  },
  bottomSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 80, // Tab bar avoidance
    paddingHorizontal: 20,
  },
  charactersContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 120,
    marginBottom: -20, // Overlap with intro card
    zIndex: 10,
    width: '100%',
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
    transform: [{ rotate: '-10deg' }],
  },
  konta: {
    zIndex: 2,
    marginLeft: -30,
    transform: [{ rotate: '10deg' }],
  },
  introCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(13, 17, 23, 0.85)", // dark transparent
    borderColor: color.accentPrimary,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: color.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 128, 51, 0.15)", // faint accent
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.accentPrimary,
  },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F56", marginRight: 6 },
  dotYellow: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E", marginRight: 6 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#27C93F", marginRight: 12 },
  cardTitle: {
    color: color.accentPrimary,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  cardBody: {
    padding: 16,
  },
  introText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "rgba(255, 128, 51, 0.2)",
    borderColor: color.accentPrimary,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 128, 51, 0.4)",
  },
  loginButton: {
    backgroundColor: color.accentIndigo,
    borderColor: "transparent",
  },
  buttonText: {
    fontFamily: "monospace",
  },
});
