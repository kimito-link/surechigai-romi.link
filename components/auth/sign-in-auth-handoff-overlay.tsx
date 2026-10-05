/**
 * sign-in ページ専用ハンドオフオーバーレイ。
 * kimitolink AuthHandoffOverlay と同一のクリック観測ロジック（押下後にだけ全画面を被せる）。
 *
 * ★到着 intro は 2026-10-05 に撤去した（ちらつきゼロ契約 ①「到着時に全画面を被せない」。
 *   正本: web-ios-android/templates/web/auth-mode/README.md ④ ／ _docs/DESIGN-signin-no-flicker-2026-10-05.md 判断 1）。
 *   以前はマウント直後に `phase: "intro"` で紺の全画面を最長 INTRO_MS=1100ms 被せていたため、
 *   「白 → ページ → 紺 → ページ」の 4 段になり、回線が遅いほど紺が長く出ていた（本家 before: フラッシュ 2 枚）。
 *   「待ちを丁寧に見せる」のはユーザーが自分で起こした待ち（ボタン押下→外部認可へ渡る瞬間）に対してだけ意味がある。
 *   ★戻さないこと。契約テスト: __tests__/signin-no-flicker.test.tsx（マウント直後に何も描かない）。
 */
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";
import { useAuthHandoff } from "@/lib/auth-handoff-context";
import { palette } from "@/theme/tokens";

const SAFETY_MS = 6000;

const LINK_CHARACTER = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

type Provider = "x" | "google" | "other";

function detectProvider(el: Element | null): Provider | null {
  const btn = el?.closest(
    ".cl-socialButtonsIconButton, .cl-socialButtonsBlockButton, [data-provider], button[data-localization-key^='socialButtonsBlockButton']",
  );
  if (!btn) return null;
  const hay = (
    (btn.getAttribute("data-provider") || "") +
    " " +
    (btn.getAttribute("aria-label") || "") +
    " " +
    (btn.getAttribute("data-localization-key") || "") +
    " " +
    (btn.className || "") +
    " " +
    (btn.textContent || "")
  ).toLowerCase();
  if (/twitter|\bx\b/.test(hay)) return "x";
  if (/google/.test(hay)) return "google";
  return "other";
}

function isAutoXEntry(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  return new URL(window.location.href).searchParams.get("auto") === "x";
}

export function SignInAuthHandoffOverlay() {
  const { hideHandoff } = useAuthHandoff();
  // ★到着時は null（何も描かない）。Clerk のソーシャルボタンが押されたときだけ provider が入る。
  const [provider, setProvider] = useState<Provider | null>(null);
  const bounce = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hideHandoff();
  }, [hideHandoff]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (isAutoXEntry()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onClick = (e: MouseEvent) => {
      const p = detectProvider(e.target as Element);
      if (!p) return;
      setProvider(p);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setProvider(null);
      }, SAFETY_MS);
    };

    document.addEventListener("click", onClick, { capture: true });
    const onPageShow = () => {
      setProvider(null);
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("pageshow", onPageShow);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!provider) return;
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -14,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    bounceLoop.start();
    return () => bounceLoop.stop();
  }, [provider, bounce]);

  useEffect(() => {
    if (!provider) return;
    const slideLoop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    slideLoop.start();
    return () => slideLoop.stop();
  }, [provider, slide]);

  if (!provider) return null;

  const overlayPosition =
    Platform.OS === "web" ? ("fixed" as const) : ("absolute" as const);

  const isX = provider === "x";
  const barTranslate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 160],
  });

  return (
    <View
      accessibilityLiveRegion="assertive"
      testID="auth-handoff-overlay"
      style={{
        position: overlayPosition,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483646,
        backgroundColor: palette.kimitoBlue,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <Animated.View style={{ transform: [{ translateY: bounce }] }}>
        <Image
          source={LINK_CHARACTER}
          style={{ width: 128, height: 128 }}
          contentFit="contain"
        />
      </Animated.View>
      <View style={{ marginTop: 24, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "900",
            color: palette.white,
            textAlign: "center",
          }}
        >
          りんくが鍵を開けています…
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 16,
            fontWeight: "600",
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
          }}
        >
          {isX
            ? "Xの画面に少し変わります。すぐ戻ってきます。"
            : "すぐにあなたのページへ。"}
        </Text>
      </View>
      <View
        style={{
          marginTop: 24,
          width: 160,
          height: 6,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.25)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: "50%",
            height: "100%",
            borderRadius: 999,
            backgroundColor: palette.kimitoOrange,
            transform: [{ translateX: barTranslate }],
          }}
        />
      </View>
    </View>
  );
}
