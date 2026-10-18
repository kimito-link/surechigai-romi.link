/**
 * ゲストホーム — LCP 向け同期ヘッダー（AppHeader / MaterialIcons / tRPC を読まない）。
 */
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Link, type Href } from "expo-router";
import { APP_HEADER_CHROME_HEIGHT_COMPACT, palette, touchTarget } from "@/theme/tokens";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/clerk-route";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { useWebSideNavActive, WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";

export const GUEST_HOME_HEADER_HEIGHT = APP_HEADER_CHROME_HEIGHT_COMPACT;

export function GuestHomeShellHeader() {
  const openLoginGuide = useLoginGuide();
  const { width } = useWindowDimensions();
  const sideNavActive = useWebSideNavActive();
  const glyphOnly = width < 360;
  const webFixed =
    Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 0,
          left: sideNavActive ? WEB_SIDE_NAV_WIDTH : 0,
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
        href={SIGN_IN_AUTO_X_HREF as Href}
        onPress={(e) => {
          e.preventDefault();
          openLoginGuide({ returnTo: "/" });
        }}
        accessibilityRole="button"
        accessibilityLabel="Xでログイン"
        style={[styles.loginLink, glyphOnly && styles.loginLinkGlyphOnly]}
      >
        <Text style={styles.loginGlyph} numberOfLines={1}>𝕏</Text>
        {!glyphOnly ? (
          <Text style={styles.loginText} numberOfLines={1}>
            1タップ
          </Text>
        ) : null}
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
    flexShrink: 0,
    gap: 6,
    // 𝕏 を名指しするボタンなので X の黒（palette.xBlack）。メインの「𝕏 1タップではじめる」と色をそろえる。
    backgroundColor: palette.xBlack,
    paddingHorizontal: 16,
    minHeight: touchTarget.minSize,
    height: touchTarget.minSize,
    borderRadius: 999,
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          display: "flex",
          textDecorationLine: "none",
          whiteSpace: "nowrap",
        } as object)
      : null),
  },
  loginLinkGlyphOnly: {
    width: touchTarget.minSize,
    paddingHorizontal: 0,
  },
  loginGlyph: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  loginText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
});
