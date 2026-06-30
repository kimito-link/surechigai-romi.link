/**
 * 公開共有 `/u/*` 用の軽量ヘッダー（Clerk SDK 非依存）。
 */
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { buildSignInHref } from "@/lib/clerk-route";
import { APP_BRAND_ICON } from "@/components/brand/app-brand-icon";
import { palette } from "@/theme/tokens";

const webChromeStyle =
  Platform.OS === "web"
    ? ({
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      } as unknown as object)
    : null;

type PublicShareHeaderProps = {
  title?: string;
  leftElement?: React.ReactNode;
  showLoginButton?: boolean;
  returnTo?: string;
};

export function PublicShareHeader({
  title = "軌跡",
  leftElement,
  showLoginButton = true,
  returnTo = "/",
}: PublicShareHeaderProps) {
  const signInHref = buildSignInHref(returnTo);

  return (
    <View style={[styles.shell, webChromeStyle]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {leftElement}
          <Image source={APP_BRAND_ICON} style={styles.logo} contentFit="cover" />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {showLoginButton ? (
          Platform.OS === "web" ? (
            <Link href={signInHref as Href} asChild>
              <Pressable style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }]}>
                <Text style={styles.loginBtnText}>ログイン</Text>
              </Pressable>
            </Link>
          ) : null
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: palette.kimitoBlueSoft,
    borderBottomWidth: 1,
    borderBottomColor: "#00427B40",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  title: {
    flex: 1,
    color: palette.kimitoBlue,
    fontSize: 16,
    fontWeight: "800",
  },
  loginBtn: {
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  loginBtnText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "800",
  },
});

export const PUBLIC_SHARE_HEADER_CHROME_HEIGHT = 52;
