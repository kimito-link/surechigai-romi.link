import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color } from "@/lib/tokens";

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
      {/* HUD HEADER: Kimito-link Logo */}
      <View style={styles.header} pointerEvents="none">
        <Image
          source={require("@/assets/images/logos/kimitolink-logo.webp")}
          style={styles.logo}
          resizeMode="contain"
        />
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

        {/* Intro Card */}
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
              全国のクリエイターから発信される極秘シグナルをキャッチせよ。{"\n"}
              レーダー上の光点（すれちがい）をタップして通信をデコードしろ。
            </Text>
            
            {!isAuthenticated ? (
              <Pressable
                style={({ pressed }) => [styles.button, styles.loginButton, pressed && styles.buttonPressed]}
                onPress={onLogin}
              >
                <Text style={[styles.buttonText, { color: color.textWhite }]}>[ SYSTEM: X (Twitter) ログイン ]</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => {
                  setIsDismissed(true);
                  onDismissIntro?.();
                }}
              >
                <Text style={styles.buttonText}>[ SYSTEM: 了解 / 監視を開始 ]</Text>
              </Pressable>
            )}
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 240,
    height: 80,
    opacity: 0.9,
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
    borderColor: color.accent,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: color.accent,
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
    borderBottomColor: color.accent,
  },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F56", marginRight: 6 },
  dotYellow: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E", marginRight: 6 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#27C93F", marginRight: 12 },
  cardTitle: {
    color: color.accent,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  cardBody: {
    padding: 16,
  },
  introText: {
    color: color.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "rgba(255, 128, 51, 0.2)",
    borderColor: color.accent,
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
    color: color.accent,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});
