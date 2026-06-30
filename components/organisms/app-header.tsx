/**
 * アプリヘッダー
 * 君斗りんくのすれ違ひ通信: 親ブランド kimito.link と同じ見た目のヘッダー。
 * - 薄青(#E2EDF7)地 + ネイビー(#00427B)の下線
 * - 左: kimito ロゴ + アプリ名（ネイビー文字）
 * - 右: ログイン状態ピル（白・丸み・アバター + 名前 + @ID）/ ログインボタン + メニュー
 * 出典: kimitolink-linktree/components/Header.tsx, HeaderCurrentAccount.tsx
 */
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Pressable, Platform, StyleSheet, useWindowDimensions } from "react-native";
import Constants from "expo-constants";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { LazyGlobalMenu } from "@/lib/lazy-heavy-components";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import * as Haptics from "expo-haptics";

const KIMITO_LOGO = require("@/assets/images/logos/kimitolink-logo.webp");
const DISPLAY_VERSION = Constants.expoConfig?.version ?? "1.0.0";

// kimito ブランドの不透明度付きライン色
const BLUE_BORDER = "#00427B40"; // kimitoBlue 25%
const BLUE_PILL_BORDER = "#00427B33"; // kimitoBlue 20%

export type AppHeaderProps = {
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
  /** ブランドコピー「会いたい君がいる現在地」を表示（既定 true）。ヒーローで強調済みの画面は false */
  showTagline?: boolean;
};

/** 固定ヘッダー分の paddingTop（tagline 込みの目安） */
export const APP_HEADER_CHROME_HEIGHT = 124;

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// Web では fixed 固定ヘッダー（全ページ共通・ハンバーガーメニュー常時表示）
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

export function AppHeader({
  title,
  subtitle,
  isDesktop = false,
  leftElement,
  rightElement,
  showLoginStatus = true,
  showMenu = true,
  showLoginButton = false,
  showTagline = true,
}: AppHeaderProps) {
  const { user, isAuthReadyForUI } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const accountMaxWidth = windowWidth < 400 ? 168 : windowWidth < 520 ? 220 : 260;
  const isNarrow = windowWidth < 480;
  const isCompactAccount = windowWidth < 520;

  const showLoginButtonStable = showLoginButton && isAuthReadyForUI && !user;
  // ログイン済みアカウントは全画面で常に同じピルを出す（Clerk ロード待ちで空白にしない）
  const showLoginStatusStable = Boolean(showLoginStatus && isAuthReadyForUI && user);

  const handleMenuPress = () => {
    triggerHaptic();
    setMenuMounted(true);
    setMenuVisible(true);
  };

  return (
    <>
      <View style={[styles.shell, webChromeStyle]}>
        <View style={[styles.topRow, isNarrow && styles.topRowNarrow]}>
          {/* 左: ロゴ + アプリ名（または任意の leftElement） */}
          <View style={[styles.brandBlock, isNarrow && styles.brandBlockNarrow]}>
            {leftElement ?? (
              <>
                <Image source={KIMITO_LOGO} style={styles.logo} contentFit="contain" />
                <View style={isNarrow ? styles.brandTitleCol : styles.brandTitleRow}>
                  <Text
                    style={[styles.brandTitle, { fontSize: isDesktop ? 18 : isNarrow ? 14 : 15 }]}
                    numberOfLines={isNarrow ? 2 : 1}
                  >
                    {title || "君斗りんくのすれ違ひ通信"}
                  </Text>
                  <Text
                    style={[styles.versionBadge, { fontSize: isDesktop ? 12 : 11 }]}
                    accessibilityLabel={`バージョン ${DISPLAY_VERSION}`}
                  >
                    v{DISPLAY_VERSION}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* 右: ログインボタン + メニュー（狭い画面ではアカウントは下段） */}
          <View style={styles.actionRow}>
            {rightElement ?? null}

            {!isNarrow && showLoginStatusStable && user ? (
              <View style={[styles.accountPill, { maxWidth: accountMaxWidth }]}>
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
            ) : !isNarrow && showLoginButtonStable ? (
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

        {isNarrow && showLoginStatusStable && user ? (
          <View style={[styles.accountPill, styles.accountPillNarrow, isCompactAccount && styles.accountPillCompact]}>
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={[styles.avatar, isCompactAccount && styles.avatarCompact]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, isCompactAccount && styles.avatarCompact]}>
                <MaterialIcons name="person" size={18} color={palette.kimitoNavInactive} />
              </View>
            )}
            <View style={styles.accountText}>
              <Text style={[styles.accountName, isCompactAccount && styles.accountNameCompact]} numberOfLines={1}>
                {user.name || user.username || "ゲスト"}
              </Text>
              <Text style={[styles.accountId, isCompactAccount && styles.accountIdCompact]} numberOfLines={1}>
                {user.username ? `@${user.username}` : user.twitterId ? user.twitterId : user.openId}
              </Text>
            </View>
          </View>
        ) : isNarrow && showLoginButtonStable ? (
          <Pressable
            onPress={() => openLoginGuide()}
            style={({ pressed }) => [
              styles.loginButton,
              styles.loginButtonNarrow,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialIcons name="login" size={17} color={palette.white} style={{ marginRight: 4 }} />
            <Text style={styles.loginButtonText}>ログイン</Text>
          </Pressable>
        ) : null}

        {/* ブランドの核「会いたい君がいる現在地」を全ページ共通でさりげなく出す */}
        {showTagline && (
          <View style={styles.taglineRow}>
            <BrandTagline compact align="left" />
          </View>
        )}

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {menuMounted && showMenu ? (
        <LazyGlobalMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      ) : null}
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
  topRowNarrow: {
    alignItems: "flex-start",
    gap: 8,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  brandBlockNarrow: {
    flex: 1,
    alignItems: "flex-start",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  brandTitleCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  brandTitle: {
    color: palette.kimitoBlue,
    fontWeight: "800",
    letterSpacing: 0,
    flexShrink: 1,
  },
  versionBadge: {
    color: palette.kimitoInkMuted,
    fontWeight: "700",
    letterSpacing: 0.2,
    flexShrink: 0,
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
  accountPillNarrow: {
    alignSelf: "stretch",
    maxWidth: "100%",
    borderRadius: 12,
    marginTop: 2,
  },
  accountPillCompact: {
    paddingVertical: 8,
  },
  avatarCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  accountNameCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  accountIdCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  loginButtonNarrow: {
    alignSelf: "stretch",
    marginTop: 4,
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
  taglineRow: {
    marginTop: 6,
    lineHeight: 18,
  },
  subtitle: {
    color: palette.kimitoInkMuted,
    fontSize: 14,
    marginTop: 6,
  },
});
