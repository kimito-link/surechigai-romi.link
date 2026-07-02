/**
 * ゲストホーム — LCP 向け同期ヘッダー（AppHeader / MaterialIcons / tRPC を読まない）。
 */
import { View, Text, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Link, type Href } from "expo-router";
import { APP_HEADER_CHROME_HEIGHT_COMPACT, palette } from "@/theme/tokens";
import { SIGN_IN_HREF } from "@/lib/clerk-route";
import { useLoginGuide } from "@/hooks/use-login-guide";

export const GUEST_HOME_HEADER_HEIGHT = APP_HEADER_CHROME_HEIGHT_COMPACT;

export function GuestHomeShellHeader() {
  const openLoginGuide = useLoginGuide();
  const { width } = useWindowDimensions();
  const glyphOnly = width < 360;
  const webFixed =
    Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        } as object)
      : null;

  return (
    <View style={[styles.shell, webFixed]} accessibilityRole="header">
      <Text style={styles.title} numberOfLines={1} accessibilityRole="text">
        君斗りんくのすれ違ひ通信
      </Text>
      <Link
        href={SIGN_IN_HREF as Href}
        onPress={() => openLoginGuide({ returnTo: "/" })}
        accessibilityRole="button"
        accessibilityLabel="Xでログイン"
        style={[styles.loginLink, glyphOnly && styles.loginLinkGlyphOnly]}
      >
        <Text style={styles.loginGlyph}>𝕏</Text>
        {!glyphOnly ? <Text style={styles.loginText}>ではじめる</Text> : null}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: GUEST_HOME_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: palette.kimitoBlueSoft,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.kimitoBlue}66`,
  },
  title: {
    flex: 1,
    color: palette.kimitoBlue,
    fontSize: 15,
    fontWeight: "800",
    marginRight: 12,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ textDecorationLine: "none" } as object) : null),
  },
  loginLinkGlyphOnly: {
    width: 40,
    paddingHorizontal: 0,
  },
  loginGlyph: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "900",
  },
  loginText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "800",
  },
});
