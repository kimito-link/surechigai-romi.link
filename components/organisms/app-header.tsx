import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { GlobalMenu } from "@/components/organisms/global-menu";
import { TalkingCharacter } from "@/components/molecules/talking-character";
import * as Haptics from "expo-haptics";
import { APP_VERSION } from "@/shared/version";
import { RedirectingScreen, WaitingReturnScreen } from "@/components/auth-ux";
import { LoginModal } from "@/components/common/LoginModal";
import { SuccessScreen } from "@/components/molecules/auth-ux/SuccessScreen";
import { CancelScreen } from "@/components/molecules/auth-ux/CancelScreen";
import { ErrorScreen } from "@/components/molecules/auth-ux/ErrorScreen";
import { useAuthUxMachine } from "@/hooks/use-auth-ux-machine";
import { WelcomeMessage } from "@/components/common/WelcomeMessage";

// ロゴ画像
const logoImage = require("@/assets/images/logo/logo-color.jpg");

// キャラクター画像
const characterImages = {
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
  kontaYukkuri: require("@/assets/images/characters/konta/kitsune-yukkuri-normal.png"),
  tanuneYukkuri: require("@/assets/images/characters/tanunee/tanuki-yukkuri-normal-mouth-open.png"),
};

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
  showCharacters = true,
  showLogo = true,
  isDesktop = false,
  rightElement,
  showLoginStatus = true,
  showMenu = true,
  showLoginButton = false,
}: AppHeaderProps) {
  
  const { user, isAuthReady, isAuthReadyForUI } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const { state, tapLogin, confirmYes, confirmNo, retry, backWithoutLogin, hideWelcome } = useAuthUxMachine();
  // 認証確定後にのみ表示して点滅を防止（ログインボタン・ログイン中バッジとも）
  // isAuthReadyForUI: Clerkが遅い場合5秒後にフォールバック表示
  const showLoginButtonStable = showLoginButton && isAuthReadyForUI && !user;
  const showLoginStatusStable = showLoginStatus && isAuthReady && user;
  
  const handleTitlePress = () => {
    triggerHaptic();
    navigate.toHome();
  };

  const handleMenuPress = () => {
    triggerHaptic();
    setMenuVisible(true);
  };

  const handleLoginPress = () => {
    triggerHaptic();
    tapLogin();
  };
  
  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: color.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable 
            onPress={handleTitlePress}
            style={({ pressed }) => [
              { flexDirection: "row", alignItems: "center", flex: 1 },
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
          >
            {showLogo && (
              <Image
                source={logoImage}
                style={{ width: isDesktop ? 56 : 48, height: isDesktop ? 56 : 48 }}
                contentFit="contain"
              />
            )}
            <View style={{ marginLeft: showLogo ? 8 : 0 }}>
              <Text style={{ 
                color: color.textWhite, 
                fontSize: isDesktop ? 16 : 13, 
                fontWeight: "bold",
              }}>
                {`${title || "君斗りんくの動員ちゃれんじ"}-${APP_VERSION}`}
              </Text>
            </View>
          </Pressable>
          
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {rightElement ? (
              rightElement
            ) : showCharacters ? (
              <View style={{ flexDirection: "row", marginRight: showMenu ? 8 : 0, alignItems: "center" }}>
                {/* タップ反応キャラクター（メイン） */}
                <TalkingCharacter
                  size={isDesktop ? 44 : 36}
                  bubblePosition="bottom"
                />
                {/* 他のキャラクター（装飾） */}
                <Image 
                  source={characterImages.kontaYukkuri} 
                  style={{ width: isDesktop ? 40 : 32, height: isDesktop ? 40 : 32, marginLeft: -8 }} 
                  contentFit="contain"
                  priority="high"
                  cachePolicy="memory-disk"
                />
                <Image 
                  source={characterImages.tanuneYukkuri} 
                  style={{ width: isDesktop ? 40 : 32, height: isDesktop ? 40 : 32, marginLeft: -8 }} 
                  contentFit="contain"
                  priority="high"
                  cachePolicy="memory-disk"
                />
              </View>
            ) : null}
            
            {/* ハンバーガーメニューボタン */}
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
                    backgroundColor: palette.white + "1A", // 10% opacity
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name="menu" size={24} color={color.textWhite} />
              </Pressable>
            )}
          </View>
        </View>
        
        {/* ログイン状態表示（認証確定後のみで点滅防止） */}
        {showLoginStatusStable && (
          <Pressable 
            onPress={handleMenuPress}
            style={({ pressed }) => [
              { 
                flexDirection: "row", 
                alignItems: "center", 
                marginTop: 8,
                backgroundColor: palette.green500 + "26", // 15% opacity
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                alignSelf: "flex-start",
              },
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
          >
            {user.profileImage && (
              <Image
                source={{ uri: user.profileImage }}
                style={{ width: 20, height: 20, borderRadius: 10, marginRight: 6 }}
                contentFit="cover"
              />
            )}
            <Text style={{ color: color.successDark, fontSize: 12, fontWeight: "600" }}>
              {user.name || user.username || "ゲスト"}でログイン中
            </Text>
            <MaterialIcons name="expand-more" size={16} color={color.successDark} style={{ marginLeft: 4 }} />
          </Pressable>
        )}
        
        {subtitle && (
          <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
        
        {/* ログインボタン（未ログイン時のみ表示・認証確定後に表示してチカチカ防止） */}
        {showLoginButtonStable && (
          <Pressable
            onPress={handleLoginPress}
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: color.twitter,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              marginTop: 12,
              alignSelf: "flex-start",
            }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
          >
            <MaterialIcons name="login" size={18} color={color.textWhite} style={{ marginRight: 6 }} />
            <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "600" }}>
              Xでログイン
            </Text>
          </Pressable>
        )}
      </View>

      {/* グローバルメニュー */}
      <GlobalMenu 
        isVisible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
      
      {/* 認証UXモーダル（共通LoginModalに統一） */}
      <LoginModal
        visible={state.name === "confirm"}
        onConfirm={confirmYes}
        onCancel={confirmNo}
      />
      <RedirectingScreen visible={state.name === "redirecting"} onDismiss={backWithoutLogin} />
      <WaitingReturnScreen 
        visible={state.name === "waitingReturn"} 
        remainingMs={state.name === "waitingReturn" ? state.timeoutMs - (Date.now() - state.startedAt) : undefined}
      />
      {state.name === "success" && (
        <SuccessScreen
          onClose={backWithoutLogin}
        />
      )}
      {state.name === "cancel" && (
        <CancelScreen
          kind={state.kind}
          onRetry={retry}
          onBack={backWithoutLogin}
        />
      )}
      {state.name === "error" && (
        <ErrorScreen
          message={state.message}
          onRetry={retry}
          onBack={backWithoutLogin}
        />
      )}
      
      {/* ウェルカムメッセージ */}
      <WelcomeMessage
        visible={state.name === "showingWelcome"}
        onHide={hideWelcome}
        userName={user?.name || user?.username}
      />
    </>
  );
}
