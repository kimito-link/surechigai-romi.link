/**
 * アプリヘッダー
 * すれちがいロミ: シンプルなヘッダー
 */
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Pressable, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
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
  const [menuVisible, setMenuVisible] = useState(false);

  const showLoginButtonStable = showLoginButton && isAuthReadyForUI && !user;
  const showLoginStatusStable = showLoginStatus && isAuthReady && user;

  const handleMenuPress = () => {
    triggerHaptic();
    setMenuVisible(true);
  };

  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: color.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: color.textWhite,
              fontSize: isDesktop ? 16 : 13,
              fontWeight: "bold",
            }}>
              {title || "君斗りんくのすれ違ひ通信"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {rightElement ?? null}

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

        {showLoginStatusStable && (
          <Pressable
            onPress={handleMenuPress}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                backgroundColor: palette.green500 + "26",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                alignSelf: "flex-start",
              },
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={{ color: color.successDark, fontSize: 12, fontWeight: "600" }}>
              {user?.name || user?.username || "ゲスト"}でログイン中
            </Text>
            <MaterialIcons name="expand-more" size={16} color={color.successDark} style={{ marginLeft: 4 }} />
          </Pressable>
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
