import { Text, View } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/ui/button";
import { redirectToTwitterAuth, redirectToTwitterSwitchAccount } from "@/lib/api";

// キャラクター画像
const characterImages = {
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  kontaYukkuri: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanuneYukkuri: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

// ロゴ画像
const logoImage = require("@/assets/images/logo/logo-maru-orange.jpg");

// ログアウトメッセージパターン
const logoutMessages = [
  { character: "linkYukkuri", message: "またねー♪", subMessage: "また遊びに来てね！" },
  { character: "kontaYukkuri", message: "バイバイ！🦊", subMessage: "次も一緒に盛り上げよう！" },
  { character: "tanuneYukkuri", message: "お疲れさま！🦝", subMessage: "また会えるの楽しみにしてるよ！" },
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
    <ScreenContainer containerClassName="bg-background">
      {/* グラデーション背景 */}
      <LinearGradient
        colors={[palette.blue600, color.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <View style={{ 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 24,
      }}>
        {/* ロゴ */}
        <Image 
          source={logoImage} 
          style={{ 
            width: 60, 
            height: 60,
            borderRadius: 30,
            marginBottom: 24,
          }} 
          contentFit="contain" 
        />

        {/* キャラクター */}
        <View style={{ position: "relative", marginBottom: 16 }}>
          <Image 
            source={characterImages[messagePattern.character as keyof typeof characterImages]} 
            style={{ 
              width: 100, 
              height: 100,
            }} 
            contentFit="contain" 
          />
          {/* チェックマーク */}
          {logoutComplete && (
            <View style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              backgroundColor: color.success,
              borderRadius: 12,
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <MaterialIcons name="check" size={16} color={color.textWhite} />
            </View>
          )}
        </View>

        {/* 吹き出し */}
        <View style={{
          backgroundColor: color.surface,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: color.border,
        }}>
          <Text style={{ color: color.accentPrimary, fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
            {messagePattern.message}
          </Text>
        </View>

        {/* ステータスメッセージ */}
        {isLoggingOut ? (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ color: color.textPrimary, fontSize: 20, fontWeight: "bold" }}>
              ログアウト中...
            </Text>
            <Text style={{ color: color.textSubtle, fontSize: 14 }}>
              しばらくお待ちください
            </Text>
          </View>
        ) : logoutComplete ? (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ color: color.textPrimary, fontSize: 20, fontWeight: "bold" }}>
              ログアウトしました
            </Text>
            <Text style={{ color: color.textSubtle, fontSize: 14 }}>
              またのご利用をお待ちしております
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ color: color.textPrimary, fontSize: 20, fontWeight: "bold" }}>
              ログアウト
            </Text>
            <Text style={{ color: color.textSubtle, fontSize: 14 }}>
              ログアウトを開始します
            </Text>
          </View>
        )}

        {/* 説明文 */}
        {logoutComplete && (
          <View style={{
            backgroundColor: color.blue400 + "15",
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
            width: "100%",
            maxWidth: 400,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <MaterialIcons name="info-outline" size={18} color={color.blue400} />
              <Text style={{ color: color.blue400, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
                ログアウトについて
              </Text>
            </View>
            <Text style={{ color: color.textPrimary, fontSize: 13, lineHeight: 20 }}>
              アカウント情報は安全に保護されました。{"\n"}
              別のアカウントでログインする場合は、下の「ログイン」ボタンをクリックしてください。{"\n"}
              同じアカウントで再度ログインすることもできます。
            </Text>
          </View>
        )}

        {/* ボタン */}
        {logoutComplete && (
          <View style={{ width: "100%", maxWidth: 400, gap: 12, marginTop: 24 }}>
            {/* ホームページに戻る */}
            <Button
              onPress={() => navigateReplace.toHomeRoot()}
              variant="primary"
              icon="home"
              fullWidth
              style={{ backgroundColor: color.info }}
            >
              ホームページに戻る
            </Button>

            {/* 同じアカウントで再ログイン */}
            <Button
              onPress={handleSameAccountLogin}
              variant="primary"
              icon="refresh"
              fullWidth
              style={{ backgroundColor: color.successDark }}
            >
              同じアカウントで再ログイン
            </Button>

            {/* 別のアカウントでログイン */}
            <Button
              onPress={handleDifferentAccountLogin}
              variant="outline"
              icon="swap-horiz"
              fullWidth
            >
              別のアカウントでログイン
            </Button>
          </View>
        )}

        {/* サブメッセージ */}
        {logoutComplete && (
          <Text style={{ 
            color: color.textSubtle, 
            fontSize: 13,
            marginTop: 24,
            textAlign: "center",
          }}>
            {messagePattern.subMessage}
          </Text>
        )}
      </View>
    </ScreenContainer>
  );
}
