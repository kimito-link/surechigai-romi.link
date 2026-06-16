import { Text, View } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/ui/button";
import { redirectToTwitterAuth, redirectToTwitterSwitchAccount } from "@/lib/api";

// キャラクター画像
const characterImages = {
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  kontaYukkuri: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanuneYukkuri: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

// ログアウトメッセージパターン
const logoutMessages = [
  { character: "linkYukkuri", message: "またねー♪", subMessage: "SYSTEM_SHUTDOWN // 接続を解除しました" },
  { character: "kontaYukkuri", message: "バイバイ！🦊", subMessage: "SESSION_END // 通信を終了しました" },
  { character: "tanuneYukkuri", message: "お疲れさま！🦝", subMessage: "DISCONNECTED // ログアウト完了" },
];

export default function LogoutScreen() {

  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [messagePattern] = useState(() => 
    logoutMessages[Math.floor(Math.random() * logoutMessages.length)]
  );

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutComplete(true);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);

  // 自動的にログアウト処理を開始
  useEffect(() => {
    if (isAuthenticated && !logoutComplete && !isLoggingOut) {
      handleLogout();
    }
  }, [isAuthenticated, handleLogout, isLoggingOut, logoutComplete]);

  const handleSameAccountLogin = () => {
    redirectToTwitterAuth();
  };

  const handleDifferentAccountLogin = () => {
    redirectToTwitterSwitchAccount();
  };

  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>

      <View style={{ 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 24,
      }}>

        {/* Hacker Auth Card */}
        <View style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "rgba(13, 17, 23, 0.95)",
          borderColor: logoutComplete ? color.success : color.danger,
          borderWidth: 1,
          borderRadius: 8,
          shadowColor: logoutComplete ? color.success : color.danger,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          overflow: 'hidden',
          alignItems: 'center',
          paddingBottom: 24,
        }}>
          
          {/* Card Header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: logoutComplete ? "rgba(39, 201, 63, 0.15)" : "rgba(255, 95, 86, 0.15)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: logoutComplete ? color.success : color.danger,
            width: "100%",
            marginBottom: 24,
          }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F56", marginRight: 6 }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E", marginRight: 6 }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#27C93F", marginRight: 12 }} />
            <Text style={{
              color: logoutComplete ? color.success : color.danger,
              fontSize: 12,
              fontWeight: "bold",
              fontFamily: "monospace",
              letterSpacing: 1,
            }}>
              SYSTEM / {logoutComplete ? "LOGOUT_SUCCESS.exe" : "LOGGING_OUT.exe"}
            </Text>
          </View>

          {/* キャラクター */}
          <View style={{ position: "relative", marginBottom: 16 }}>
            <Image 
              source={characterImages[messagePattern.character as keyof typeof characterImages]} 
              style={{ 
                width: 120, 
                height: 120,
              }} 
              contentFit="contain" 
            />
          </View>

          {/* 吹き出し */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
              {messagePattern.message}
            </Text>
          </View>

          {/* ステータスメッセージ */}
          <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 24 }}>
            <Text style={{ color: logoutComplete ? color.success : "#FFFFFF", fontSize: 18, fontWeight: "bold", fontFamily: "monospace" }}>
              {isLoggingOut ? "ログアウト処理中..." : logoutComplete ? "SYSTEM OFFLINE" : "ログアウト開始"}
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13, fontFamily: "monospace", textAlign: "center" }}>
              {isLoggingOut ? "PLEASE WAIT..." : messagePattern.subMessage}
            </Text>
          </View>

          {/* ボタン */}
          {logoutComplete && (
            <View style={{ width: "100%", paddingHorizontal: 24, gap: 12, marginTop: 32 }}>
              <Button
                onPress={() => navigateReplace.toHomeRoot()}
                variant="primary"
                icon="home"
                fullWidth
                style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: color.textMuted, borderWidth: 1 }}
              >
                ホーム画面へ戻る
              </Button>

              <Button
                onPress={handleSameAccountLogin}
                variant="primary"
                icon="refresh"
                fullWidth
                style={{ backgroundColor: color.accentIndigo }}
              >
                同じアカウントで再接続
              </Button>

              <Button
                onPress={handleDifferentAccountLogin}
                variant="outline"
                icon="swap-horiz"
                fullWidth
              >
                別のアカウントで接続
              </Button>
            </View>
          )}

        </View>

      </View>
    </ScreenContainer>
  );
}
