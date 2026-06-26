/**
 * 認証ハンドオフ全画面オーバーレイ。
 *
 * kimito.link の AuthHandoffOverlay を React Native へ移植。
 * 「Xではじめる」押下〜X 認可画面へ遷移するまでの一瞬に被せ、待ちを「丁寧な準備」に変える。
 * （出典: kimitolink-linktree/components/AuthHandoffOverlay.tsx）
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { palette } from "@/theme/tokens";
import { useAuthHandoff } from "@/lib/auth-handoff-context";

const LINK_CHARACTER = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");
const useNative = Platform.OS !== "web";

export function AuthHandoffOverlay() {
  const { visible, provider } = useAuthHandoff();
  const bounce = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -14,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: useNative,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: useNative,
        }),
      ]),
    );
    const slideLoop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: useNative,
      }),
    );
    bounceLoop.start();
    slideLoop.start();

    return () => {
      bounceLoop.stop();
      slideLoop.stop();
      bounce.setValue(0);
      slide.setValue(0);
    };
  }, [visible, bounce, slide]);

  if (!visible) return null;

  const isX = provider === "x";
  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 200],
  });

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={{ transform: [{ translateY: bounce }] }}>
        <Image source={LINK_CHARACTER} style={styles.character} contentFit="contain" />
      </Animated.View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>りんくが鍵を開けています…</Text>
        <Text style={styles.subtitle}>
          {isX
            ? "Xの画面に少し変わります。すぐ戻ってきます。"
            : "すぐにあなたのページへ。"}
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.bar, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483646,
    backgroundColor: palette.kimitoBlue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  character: {
    width: 128,
    height: 128,
  },
  textWrap: {
    alignItems: "center",
  },
  title: {
    color: palette.white,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 12,
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  track: {
    height: 6,
    width: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    width: 80,
    borderRadius: 999,
    backgroundColor: palette.kimitoOrange,
  },
});
