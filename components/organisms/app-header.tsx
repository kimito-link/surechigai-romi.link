/**
 * アプリヘッダー
 * すれちがいロミ: シンプルなヘッダー
 */
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { UserAccountChip } from "@/components/molecules/user-account-chip";
import { GlobalMenu } from "@/components/organisms/global-menu";
import * as Haptics from "expo-haptics";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showCharacters?: boolean;
  showLogo?: boolean;
  isDesktop?: boolean;
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
  isDesktop = false,
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
      <View style={styles.shell}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.title,
                { fontSize: isDesktop ? 16 : 13 },
              ]}
              numberOfLines={1}
            >
              {title || "君斗りんくのすれ違ひ通信"}
            </Text>
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
                    minHeight: 40,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    backgroundColor: color.twitter,
                    marginRight: 8,
                  },
                  pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                ]}
              >
                <MaterialIcons name="login" size={17} color={color.textWhite} style={{ marginRight: 4 }} />
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
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 22,
                    backgroundColor: palette.white + "1A",
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name="menu" size={24} color={color.textWhite} />
              </Pressable>
            )}
          </View>
        </View>

        {showLoginStatusStable && user && (
          <UserAccountChip
            user={user}
            compact={!isDesktop}
            onPress={handleMenuPress}
            style={{
              marginTop: 10,
              width: isDesktop ? 470 : "100%",
              maxWidth: "100%",
            }}
          />
        )}

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
    paddingTop: 16,
    paddingBottom: 9,
    backgroundColor: color.bg,
    borderBottomWidth: 1,
    borderBottomColor: palette.white + "0F",
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
    color: color.textWhite,
    fontWeight: "800",
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
});
