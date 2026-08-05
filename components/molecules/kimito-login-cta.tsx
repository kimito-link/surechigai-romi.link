/**
 * Xログイン CTA — kimito.link ライト UI 準拠（Web で背景色が確実に効く）
 */
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { palette } from "@/theme/tokens";
import { isNativeAppShell } from "@/lib/native-app-shell";

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
  // ネイティブアプリ(App Store 審査対象)では特定プロバイダを名指ししない。
  // X の字面と「1タップ」を出すと、実際は Apple も選べるのに
  // 「X ログインしか無い」と見える（2026-08-05 Guideline 4.8 却下の一因）。
  const isNative = isNativeAppShell();
  const nativeLabel = isStarting ? "接続中…" : "はじめる";
  const displayLabel = isStarting ? "接続中…" : label;
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

  return (
    <Pressable
      disabled={isStarting}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [
        buttonStyle,
        pressed && { opacity: 0.85 },
        isStarting && { opacity: 0.65 },
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
