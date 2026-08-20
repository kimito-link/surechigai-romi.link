/**
 * Xログイン CTA — kimito.link ライト UI 準拠（Web で背景色が確実に効く）
 */
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { palette } from "@/theme/tokens";
import { isNativeAppShell } from "@/lib/native-app-shell";
import { useAuth } from "@/hooks/use-auth";

/**
 * 認証の準備をこれ以上待たない上限。
 * 超えたらボタンを押せる状態に戻す（永久に固まらせない）。
 * clerk-auth-bridge.tsx の authReadyTimeout(1000ms) より長めにして、
 * 正常時にこちらが先に発火して二重に見えないようにする。
 */
const AUTH_WAIT_TIMEOUT_MS = 4000;

type KimitoLoginCtaProps = {
  signInHref: string;
  label?: string;
  isStarting?: boolean;
  onPress?: () => void;
};

const buttonStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  gap: 8,
  backgroundColor: palette.kimitoBlue,
  paddingVertical: 13,
  borderRadius: 999,
  minHeight: 48,
};

export function KimitoLoginCta({
  signInHref,
  label = "1タップではじめる",
  isStarting = false,
  onPress,
}: KimitoLoginCtaProps) {
  /* ★2026-08-21 iOS build 520 却下の真因:
     「はじめる / Login with X が反応しない」。押しても本当に何も起きなかった。

     認証プロバイダの chunk を解決している間、app/_layout.tsx は
     AUTH_LOADING_PLACEHOLDER（`login: async () => {}` ＝ 何もしない関数）を配る。
     この間もゲスト画面は描かれるので、**見た目は完全に押せるボタンなのに
     押すと無反応**になる。app/(tabs)/index.tsx は未ログイン時に
     isAuthReadyForUI を待たず PostGuestScreen を即描画するため、
     初回起動（＝審査員の状態）でこの窓に入りやすい。

     one-tap-guest-shell と app-header は isAuthReadyForUI で出し分けていたが、
     inline-login-prompt と post-guest-screen には出し分けが無かった。
     呼び出し側で個別に足すと**また足し忘れる**ので、ボタン自身が知る。
     準備前は既存の「接続中…」表示（disabled + 半透明）に倒す。 */
  /* ★ただし「準備中」を無期限に信じない（2026-08-21・検証で発覚）。
     認証プロバイダの読み込みが失敗すると isAuthReadyForUI は永久に false のままで、
     ボタンが**永久に押せなくなる**。それは却下された「無反応」より悪い。
     一定時間で諦めて押せる状態に戻し、押した先でエラーを見せる方に倒す
     （clerk-auth-bridge.tsx の authReadyTimeout と同じ考え方）。 */
  const { isAuthReadyForUI } = useAuth();
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  useEffect(() => {
    if (isAuthReadyForUI) return;
    const t = setTimeout(() => setWaitedTooLong(true), AUTH_WAIT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isAuthReadyForUI]);

  const isPreparing = !isAuthReadyForUI && !waitedTooLong;
  const busy = isStarting || isPreparing;

  // ネイティブアプリ(App Store 審査対象)では特定プロバイダを名指ししない。
  // X の字面と「1タップ」を出すと、実際は Apple も選べるのに
  // 「X ログインしか無い」と見える（2026-08-05 Guideline 4.8 却下の一因）。
  const isNative = isNativeAppShell();
  const nativeLabel = busy ? "接続中…" : "はじめる";
  const displayLabel = busy ? "接続中…" : label;
  const content = isNative ? (
    <Text style={styles.buttonText}>{nativeLabel}</Text>
  ) : (
    <>
      <Text style={styles.xGlyph}>𝕏</Text>
      <Text style={styles.buttonText}>{displayLabel}</Text>
    </>
  );
  const a11yLabel = isNative
    ? `${nativeLabel}（AppleまたはXでサインイン）`
    : `Xで${displayLabel}`;

  if (Platform.OS === "web") {
    // 実 <a href> を出す: E2E/クローラー/右クリック新規タブなどのブラウザネイティブ機能を保つ。
    // onPress は preventDefault しない（href への遷移は保ちつつログインガイド機構も併走させる）。
    // ★Web は href があるので準備中でも遷移できる（無反応にならない）。
    //   よって isPreparing で殺さない。文言だけ busy に従う。
    return (
      <Link
        href={signInHref as Href}
        onPress={() => {
          if (isStarting) return;
          onPress?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={[
          buttonStyle,
          styles.webLink,
          isStarting && { opacity: 0.65 },
        ]}
      >
        {content}
      </Link>
    );
  }

  /* ネイティブは href が無く onPress が唯一の経路。準備前は login が
     何もしない関数なので、押せるように見せず「接続中…」で待たせる。 */
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: busy, busy }}
      style={({ pressed }) => [
        buttonStyle,
        pressed && { opacity: 0.85 },
        busy && { opacity: 0.65 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  webLink: {
    textDecorationLine: "none",
    display: "flex",
    width: "100%",
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
});
