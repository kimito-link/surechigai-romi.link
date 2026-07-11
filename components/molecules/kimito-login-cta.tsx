/**
 * Xログイン CTA — kimito.link ライト UI 準拠（Web で背景色が確実に効く）
 */
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { palette } from "@/theme/tokens";

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
  const displayLabel = isStarting ? "接続中…" : label;
  const content = (
    <>
      <Text style={styles.xGlyph}>𝕏</Text>
      <Text style={styles.buttonText}>{displayLabel}</Text>
    </>
  );

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
        accessibilityLabel={`Xで${displayLabel}`}
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
      accessibilityLabel={`Xで${displayLabel}`}
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
