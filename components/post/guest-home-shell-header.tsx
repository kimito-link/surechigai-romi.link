/**
 * ゲストホーム — LCP 向け同期ヘッダー（AppHeader / MaterialIcons / tRPC を読まない）。
 */
import { View, Text, StyleSheet, Platform } from "react-native";
import { Link, type Href } from "expo-router";
import { APP_HEADER_CHROME_HEIGHT_COMPACT, palette } from "@/theme/tokens";
import { SIGN_IN_HREF } from "@/lib/clerk-route";

export const GUEST_HOME_HEADER_HEIGHT = APP_HEADER_CHROME_HEIGHT_COMPACT;

export function GuestHomeShellHeader() {
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
        accessibilityRole="button"
        accessibilityLabel="Xでログイン"
        style={styles.loginLink}
      >
        <Text style={styles.loginText}>ログイン</Text>
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
    backgroundColor: "#E2EDF7",
    borderBottomWidth: 1,
    borderBottomColor: "#00427B40",
  },
  title: {
    flex: 1,
    color: palette.kimitoBlue,
    fontSize: 15,
    fontWeight: "800",
    marginRight: 12,
  },
  loginLink: {
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ textDecorationLine: "none" } as object) : null),
  },
  loginText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "800",
  },
});
