/**
 * アプリヘッダー
 * すれちがいロミ: 親ブランド kimito.link と同じ見た目のヘッダー。
 * - 薄青(#E2EDF7)地 + ネイビー(#00427B)の下線
 * - 左: kimito ロゴ + アプリ名（ネイビー文字）
 * - 右: ログイン状態ピル（白・丸み・アバター + 名前 + @ID）/ ログインボタン + メニュー
 * 出典: kimitolink-linktree/components/Header.tsx, HeaderCurrentAccount.tsx
 */
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { GlobalMenu } from "@/components/organisms/global-menu";
import * as Haptics from "expo-haptics";

const KIMITO_LOGO = require("@/assets/images/logos/kimitolink-logo.webp");

// kimito ブランドの不透明度付きライン色
const BLUE_BORDER = "#00427B40"; // kimitoBlue 25%
const BLUE_PILL_BORDER = "#00427B33"; // kimitoBlue 20%

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showCharacters?: boolean;
  showLogo?: boolean;
  isDesktop?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showLoginStatus?: boolean;
  showMenu?: boolean;
  showLoginButton?: boolean;
}

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// Web では sticky 固定ヘッダー（スクロールしても常に上部に残す）。
// kimito.link と同じ「常時見えるヘッダー＋ログイン状態」体験にする。
const webStickyStyle =
  Platform.OS === "web"
    ? ({ position: "sticky", top: 0, zIndex: 50 } as unknown as object)
    : null;

export function AppHeader({
  title,
  subtitle,
  isDesktop = false,
  leftElement,
  rightElement,
  showLoginStatus = true,
  showMenu = true,
  showLoginButton = false,
}: AppHeaderProps) {
  const { user, isAuthReady, isAuthReadyForUI } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [menuVisible, setMenuVisible] = useState(false);

  const showLoginButtonStable = showLoginButton && isAuthReadyForUI && !user;
  const showLoginStatusStable = Boolean(showLoginStatus && isAuthReady && user);

  const handleMenuPress = () => {
    triggerHaptic();
    setMenuVisible(true);
  };

  return (
    <>
      <View style={[styles.shell, webStickyStyle]}>
        <View style={styles.topRow}>
          {/* 左: ロゴ + アプリ名（または任意の leftElement） */}
          <View style={styles.brandBlock}>
            {leftElement ?? (
              <>
                <Image source={KIMITO_LOGO} style={styles.logo} contentFit="contain" />
                <Text
                  style={[styles.brandTitle, { fontSize: isDesktop ? 18 : 15 }]}
                  numberOfLines={1}
                >
                  {title || "君斗りんくのすれ違ひ通信"}
                </Text>
              </>
            )}
          </View>

          {/* 右: ログイン状態ピル / ログインボタン + メニュー */}
          <View style={styles.actionRow}>
            {rightElement ?? null}

            {showLoginStatusStable && user ? (
              <View style={styles.accountPill}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <MaterialIcons name="person" size={20} color={palette.kimitoNavInactive} />
                  </View>
                )}
                <View style={styles.accountText}>
                  <Text style={styles.accountStatus} numberOfLines={1}>
                    現在このアカウントでログインしています
                  </Text>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {user.name || user.username || "ゲスト"}
                  </Text>
                  <View style={styles.accountMetaRow}>
                    <Text style={styles.accountId} numberOfLines={1}>
                      {user.username ? `@${user.username}` : user.twitterId ? user.twitterId : user.openId}
                    </Text>
                    {typeof user.followersCount === "number" && (
                      <Text style={styles.accountFollowers} numberOfLines={1}>
                        ﾌｫﾛﾜｰ {user.followersCount.toLocaleString("ja-JP")}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : showLoginButtonStable ? (
              <Pressable
                onPress={() => openLoginGuide()}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                <MaterialIcons name="login" size={17} color={palette.white} style={{ marginRight: 4 }} />
                <Text style={styles.loginButtonText}>ログイン</Text>
              </Pressable>
            ) : null}

            {showMenu && (
              <Pressable
                onPress={handleMenuPress}
                style={({ pressed }) => [
                  styles.menuButton,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name="menu" size={24} color={palette.kimitoBlue} />
              </Pressable>
            )}
          </View>
        </View>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <GlobalMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: color.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: BLUE_BORDER,
  },
  topRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  brandTitle: {
    color: palette.kimitoBlue,
    fontWeight: "800",
    letterSpacing: 0,
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  accountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: BLUE_PILL_BORDER,
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 5,
    maxWidth: 260,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    flexShrink: 0,
  },
  avatarFallback: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    minWidth: 0,
    flexShrink: 1,
  },
  accountStatus: {
    color: palette.kimitoBlue,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  accountName: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
  },
  accountMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  accountId: {
    color: palette.kimitoNavInactive,
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 1,
  },
  accountFollowers: {
    color: palette.kimitoInkMuted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    flexShrink: 0,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlue,
  },
  loginButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "700",
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: BLUE_PILL_BORDER,
  },
  subtitle: {
    color: palette.kimitoInkMuted,
    fontSize: 14,
    marginTop: 6,
  },
});
