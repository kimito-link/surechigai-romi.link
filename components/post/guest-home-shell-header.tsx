/**
 * ゲストホーム — LCP 向け同期ヘッダー（AppHeader / MaterialIcons / tRPC を読まない）。
 */
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Link, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_HEADER_CHROME_HEIGHT_COMPACT, palette, touchTarget } from "@/theme/tokens";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/clerk-route";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { useWebSideNavActive, WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";
import { isNativeAppShell } from "@/lib/native-app-shell";

// LCP 用の軽いヘッダーなので expo-image ではなく RN の Image で読む（brand-constants は定数だけ）。
import { KIMITO_LINK_MARK, KIMITO_LINK_MARK_ASPECT } from "@/components/brand/brand-constants";

/** kimito.link 本体・Voice と同じ左上の筆記体ロゴ */
const MARK_HEIGHT = 34;
const MARK_WIDTH = Math.round(MARK_HEIGHT * KIMITO_LINK_MARK_ASPECT);

export const GUEST_HOME_HEADER_HEIGHT = APP_HEADER_CHROME_HEIGHT_COMPACT;

export function GuestHomeShellHeader() {
  const openLoginGuide = useLoginGuide();
  const { width } = useWindowDimensions();
  const sideNavActive = useWebSideNavActive();
  const glyphOnly = width < 360;
  // ★iOS/Android アプリでは時計・ダイナミックアイランドの下から始める（2026-11-13 実機で重なりを確認）。
  //   ゲストホームは ScreenContainer を通らないので、上の余白をここで足す。Web は従来どおり。
  const insets = useSafeAreaInsets();
  const nativeTopInset =
    Platform.OS === "web" ? null : { paddingTop: insets.top, height: GUEST_HOME_HEADER_HEIGHT + insets.top };
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

  // ★2026-11-13 kimito.link の一部に見えるよう、左上を本体・Voice と同じ「Kimito Link」ロゴに、
  //   ボタンを本体と同じ紺にそろえた。
  // ★ネイティブアプリでは X を名指ししない（Apple でも入れる。Guideline 4.8。KimitoLoginCta と同じ扱い）。
  const native = isNativeAppShell();
  const loginLabel = native ? "ログイン" : "X で参加する";

  return (
    <View style={[styles.shell, webFixed, nativeTopInset]} accessibilityRole="header">
      <View style={styles.brand}>
        <Image
          source={KIMITO_LINK_MARK}
          accessibilityLabel="Kimito Link"
          style={styles.mark}
          resizeMode="contain"
        />
        <View style={styles.brandDivider} />
        <Text style={styles.title} numberOfLines={1} accessibilityRole="text">
          すれ違ひ通信
        </Text>
      </View>
      <Link
        href={SIGN_IN_AUTO_X_HREF as Href}
        onPress={(e) => {
          e.preventDefault();
          openLoginGuide({ returnTo: "/" });
        }}
        accessibilityRole="button"
        accessibilityLabel={native ? "ログイン" : "Xでログイン"}
        style={[styles.loginLink, glyphOnly && !native && styles.loginLinkGlyphOnly]}
      >
        {!native ? <Text style={styles.loginGlyph} numberOfLines={1}>𝕏</Text> : null}
        {native || !glyphOnly ? (
          <Text style={styles.loginText} numberOfLines={1}>
            {native ? loginLabel : "で参加する"}
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
    // kimito.link 本体のヘッダーと同じ薄青（DESIGN.md: 薄青 #E2EDF7 をヘッダーに）
    backgroundColor: palette.kimitoBlueSoft,
    borderBottomWidth: 1,
    borderBottomColor: palette.kimitoBorderSoft,
    ...(Platform.OS === "web"
      ? ({
          backgroundColor: "rgba(226,237,247,0.94)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        } as object)
      : null),
  },
  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 12,
    minWidth: 0,
  },
  mark: {
    width: MARK_WIDTH,
    height: MARK_HEIGHT,
  },
  brandDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(0,66,123,0.2)",
  },
  title: {
    flexShrink: 1,
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 6,
    // kimito.link 本体の「X で参加する」と同じ紺。
    backgroundColor: palette.kimitoBlue,
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
