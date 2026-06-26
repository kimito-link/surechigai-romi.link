import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Pressable, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { GlobalMenu } from "@/components/organisms/global-menu";
import * as Haptics from "expo-haptics";
import { useRouter, usePathname } from "expo-router";

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

export function AppHeader({
  title,
  subtitle,
  isDesktop: propIsDesktop,
  leftElement,
  rightElement,
  showLoginStatus = true,
  showMenu = true,
  showLoginButton = false,
}: AppHeaderProps) {
  const { user, isAuthReady, isAuthReadyForUI, logout } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isDesktop = propIsDesktop ?? (Platform.OS === "web" && width >= 768);
  const isWeb = Platform.OS === "web";

  const showLoginButtonStable = showLoginButton && isAuthReadyForUI && !user;
  const showLoginStatusStable = Boolean(showLoginStatus && isAuthReady && user);

  const handleMenuPress = () => {
    triggerHaptic();
    setMenuVisible(true);
  };

  const navItems = [
    { label: "ホーム", path: "/" },
    { label: "図鑑", path: "/zukan" },
    { label: "マイページ", path: "/mypage" },
  ];

  if (isWeb && isDesktop) {
    return (
      <View style={styles.webHeaderShell}>
        <View style={styles.webHeaderContent}>
          {/* 左: ロゴ */}
          <View style={styles.webLogoSection}>
            {leftElement ? leftElement : (
              <Pressable onPress={() => router.push("/")} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.webLogoText}>
                  kimito.link
                </Text>
                <Text style={styles.webLogoSub}> | すれちがいロミ</Text>
              </Pressable>
            )}
          </View>

          {/* 中央: ナビゲーション */}
          <View style={styles.webNavSection}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  style={[styles.webNavItem, isActive && styles.webNavItemActive]}
                >
                  <Text style={[styles.webNavItemText, isActive && styles.webNavItemTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 右: アカウント情報 */}
          <View style={styles.webActionSection}>
            {rightElement}
            
            {showLoginButtonStable && (
              <Pressable
                onPress={() => openLoginGuide()}
                style={styles.webLoginButton}
              >
                <Text style={styles.webLoginButtonText}>ログイン / 登録</Text>
              </Pressable>
            )}

            {showLoginStatusStable && user && (
              <View style={styles.webUserPillWrapper}>
                <View style={styles.webUserPill}>
                  {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.webUserAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.webUserAvatar, { backgroundColor: palette.gray200, alignItems: "center", justifyContent: "center" }]}>
                      <MaterialIcons name="person" size={20} color={color.textMuted} />
                    </View>
                  )}
                  <View style={styles.webUserInfo}>
                    <Text style={styles.webUserPillHint}>現在このアカウントでログインしています</Text>
                    <Text style={styles.webUserName} numberOfLines={1}>{user.name || user.username || "ゲスト"}</Text>
                    <Text style={styles.webUserHandle} numberOfLines={1}>@{user.username || user.twitterId || user.openId}</Text>
                  </View>
                </View>
                
                <Pressable onPress={logout} style={styles.webLogoutButton}>
                  <Text style={styles.webLogoutButtonText}>ログアウト</Text>
                </Pressable>
              </View>
            )}
            
            {showMenu && !isDesktop && (
              <Pressable onPress={handleMenuPress} style={styles.webMenuButton}>
                <MaterialIcons name="menu" size={24} color={color.textPrimary} />
              </Pressable>
            )}
          </View>
        </View>
        <GlobalMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      </View>
    );
  }

  // Mobile / Standard Header
  return (
    <>
      <View style={styles.shell}>
        <View style={styles.topRow}>
          {leftElement && (
            <View style={{ marginRight: 8 }}>
              {leftElement}
            </View>
          )}
          <View style={styles.titleBlock}>
            {showLoginStatusStable && user ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.gray200, alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="person" size={20} color={color.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: color.textPrimary, fontSize: 14, fontWeight: "bold" }} numberOfLines={1}>
                    {user.name || user.username || "ゲスト"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: color.textMuted, fontSize: 11 }} numberOfLines={1}>
                      {user.username ? `@${user.username}` : user.twitterId ? user.twitterId : user.openId}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text
                style={[
                  styles.title,
                  { fontSize: isDesktop ? 16 : 15 },
                ]}
                numberOfLines={1}
              >
                {title || "すれちがいロミ"}
              </Text>
            )}
          </View>

          <View style={styles.actionRow}>
            {rightElement ?? null}

            {showLoginButtonStable && (
              <Pressable
                onPress={() => openLoginGuide()}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 36,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: color.accentPrimary,
                    marginRight: 8,
                  },
                  pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={{ color: color.textWhite, fontSize: 13, fontWeight: "700" }}>
                  ログイン
                </Text>
              </Pressable>
            )}

            {showMenu && (
              <Pressable
                onPress={handleMenuPress}
                style={({ pressed }) => [
                  {
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 20,
                    backgroundColor: palette.gray100,
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name="menu" size={24} color={color.textPrimary} />
              </Pressable>
            )}
          </View>
        </View>

        {subtitle && (
          <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <GlobalMenu
        isVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 16 : 48, // Add padding for mobile status bar manually if needed, usually SafeArea handles it
    paddingBottom: 12,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  topRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    color: color.textPrimary,
    fontWeight: "800",
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  
  // Web Desktop Styles
  webHeaderShell: {
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    paddingHorizontal: 24,
    height: 72,
    justifyContent: "center",
  },
  webHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    marginHorizontal: "auto",
    width: "100%",
  },
  webLogoSection: {
    flex: 1,
    justifyContent: "center",
  },
  webLogoText: {
    fontSize: 20,
    fontWeight: "900",
    color: color.accentPrimary,
    letterSpacing: -0.5,
  },
  webLogoSub: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textSecondary,
    marginLeft: 4,
    marginTop: 3,
  },
  webNavSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  webNavItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  webNavItemActive: {
    backgroundColor: palette.gray100,
  },
  webNavItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: color.textSecondary,
  },
  webNavItemTextActive: {
    color: color.textPrimary,
  },
  webActionSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
  },
  webUserPillWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  webUserPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  webUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  webUserInfo: {
    justifyContent: "center",
  },
  webUserPillHint: {
    fontSize: 10,
    color: color.textMuted,
    marginBottom: 2,
  },
  webUserName: {
    fontSize: 13,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  webUserHandle: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 1,
  },
  webLogoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: palette.gray100,
    borderWidth: 1,
    borderColor: color.border,
  },
  webLogoutButtonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: color.textSecondary,
  },
  webLoginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: color.accentPrimary,
  },
  webLoginButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  webMenuButton: {
    padding: 8,
  }
});
