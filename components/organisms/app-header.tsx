/**
 * アプリヘッダー
 * 君斗りんくのすれ違ひ通信: 親ブランド kimito.link と同じ見た目のヘッダー。
 * - 薄青(#E2EDF7)地 + ネイビー(#00427B)の下線
 * - 左: ゆっくりりんくアイコン + アプリ名（ネイビー文字）
 * - 右: ログイン状態ピル（白・丸み・アバター + 名前 + @ID）/ ログインボタン + メニュー
 * 出典: kimitolink-linktree/components/Header.tsx, HeaderCurrentAccount.tsx
 */
import { useState } from "react";
import { color, palette, APP_HEADER_CHROME_HEIGHT, APP_HEADER_CHROME_HEIGHT_COMPACT, APP_HEADER_CHROME_HEIGHT_FULL } from "@/theme/tokens";
import { View, Text, Pressable, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { LazyGlobalMenu } from "@/lib/lazy-heavy-components";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { BrandHomeLink, BrandHomeTaglineLink } from "@/components/brand/brand-home-link";
import { navigate } from "@/lib/navigation";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { useWebSideNavActive, WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";

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
  /** full=ポスト等 / compact=タブ画面（タグライン非表示・低ヘッダー） */
  variant?: "full" | "compact";
  /** ヘッダー直下のコンテキスト行（固定ヘッダー内） */
  contextBar?: React.ReactNode;
};

/** 固定ヘッダー分の paddingTop（tagline 込みの目安） */
export {
  APP_HEADER_CHROME_HEIGHT,
  APP_HEADER_CHROME_HEIGHT_COMPACT,
  APP_HEADER_CHROME_HEIGHT_FULL,
};

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// Web では fixed 固定ヘッダー（全ページ共通・ハンバーガーメニュー常時表示）
function useWebHeaderStyle() {
  const sideNav = useWebSideNavActive();
  if (Platform.OS !== "web") return null;
  return {
    position: "fixed",
    top: 0,
    left: sideNav ? WEB_SIDE_NAV_WIDTH : 0,
    right: 0,
    zIndex: 100,
  } as unknown as object;
}

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
  variant = "full",
  contextBar,
}: AppHeaderProps) {
  const { user, isAuthReadyForUI } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const accountMaxWidth = windowWidth < 400 ? 168 : windowWidth < 520 ? 220 : 260;
  const isNarrow = windowWidth < 480;
  const isCompactAccount = windowWidth < 520;
  const webChromeStyle = useWebHeaderStyle();

  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: Boolean(showLoginStatus && isAuthReadyForUI && user),
    staleTime: 30_000,
  });
  const livePresenceOn = settings?.livePresenceEnabled ?? false;

  const goMypage = () => {
    triggerHaptic();
    navigate.toMypageTab();
  };

  const showLoginButtonStable = showLoginButton && isAuthReadyForUI && !user;
  // ログイン済みアカウントは全画面で常に同じピルを出す（Clerk ロード待ちで空白にしない）
  const showLoginStatusStable = Boolean(showLoginStatus && isAuthReadyForUI && user);

  const handleMenuPress = () => {
    triggerHaptic();
    setMenuMounted(true);
    setMenuVisible(true);
  };

  const isCompactHeader = variant === "compact";
  const showTaglineRow = showTagline && !isCompactHeader;
  const displayTitle = isCompactHeader
    ? title || "君斗りんくのすれ違ひ通信"
    : title || "君斗りんくのすれ違ひ通信";

  return (
    <>
      <View style={[styles.shell, webChromeStyle, isCompactHeader && styles.shellCompact]}>
        <View style={[styles.topRow, isNarrow && styles.topRowNarrow]}>
          <View style={[styles.brandBlock, isNarrow && styles.brandBlockNarrow]}>
            {leftElement ?? null}
            <BrandHomeLink
              title={displayTitle}
              isDesktop={isDesktop}
              isNarrow={isNarrow}
              compact={isCompactHeader}
            />
          </View>

          {/* 右: ログインボタン + メニュー（狭い画面ではアカウントは下段） */}
          <View style={styles.actionRow}>
            {rightElement ?? null}

            {!isNarrow && showLoginStatusStable && user ? (
              <Pressable
                onPress={goMypage}
                accessibilityRole="button"
                accessibilityLabel="マイページを開く"
                style={({ pressed, hovered }) => [
                  styles.accountPill,
                  { maxWidth: accountMaxWidth },
                  Platform.OS === "web" && (hovered as boolean) && styles.accountPillHover,
                  pressed && styles.accountPillPressed,
                ]}
              >
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
              </Pressable>
            ) : !isNarrow && showLoginButtonStable ? (
              <Pressable
                onPress={() => openLoginGuide()}
                accessibilityRole="button"
                accessibilityLabel="Xでログイン"
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
                accessibilityRole="button"
                accessibilityLabel="メニューを開く"
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
          <Pressable
            onPress={goMypage}
            accessibilityRole="button"
            accessibilityLabel="マイページを開く"
            style={({ pressed, hovered }) => [
              styles.accountPill,
              styles.accountPillNarrow,
              isCompactAccount && styles.accountPillCompact,
              Platform.OS === "web" && (hovered as boolean) && styles.accountPillHover,
              pressed && styles.accountPillPressed,
            ]}
          >
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
          </Pressable>
        ) : isNarrow && showLoginButtonStable ? (
          <Pressable
            onPress={() => openLoginGuide()}
            accessibilityRole="button"
            accessibilityLabel="Xでログイン"
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

        {showTaglineRow && (
          <View style={styles.taglineRowWrap}>
            <BrandHomeTaglineLink>
              <View style={styles.taglineRow}>
                <BrandTagline compact align="left" />
              </View>
            </BrandHomeTaglineLink>
            {livePresenceOn ? (
              <View style={styles.liveBadge} accessibilityLabel="居場所をリアルタイム公開中">
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>居場所ON</Text>
              </View>
            ) : null}
          </View>
        )}

        {contextBar}

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
  shellCompact: {
    paddingTop: 10,
    paddingBottom: 8,
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
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  accountPillHover: {
    borderColor: palette.kimitoBlue,
    backgroundColor: "#F8FBFF",
  },
  accountPillPressed: {
    opacity: 0.9,
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
    marginTop: 0,
    lineHeight: 18,
  },
  taglineRowWrap: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,128,51,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,128,51,0.35)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.kimitoOrange,
  },
  liveBadgeText: {
    color: palette.kimitoOrange,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: palette.kimitoInkMuted,
    fontSize: 14,
    marginTop: 6,
  },
});
