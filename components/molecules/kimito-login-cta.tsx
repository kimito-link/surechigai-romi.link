/**
 * Xログイン CTA — kimito.link ライト UI 準拠（Web で背景色が確実に効く）
 */
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
    return (
      <Pressable
        disabled={isStarting}
        onPress={() => {
          if (isStarting) return;
          if (onPress) {
            onPress();
            return;
          }
          if (typeof window !== "undefined") {
            window.location.assign(signInHref);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Xで${displayLabel}`}
        style={({ pressed }) => [
          buttonStyle,
          styles.webLink,
          pressed && !isStarting && { opacity: 0.85 },
          isStarting && { opacity: 0.65 },
        ]}
      >
        {content}
      </Pressable>
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
