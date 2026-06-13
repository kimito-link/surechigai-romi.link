import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { LogoutConfirmModal } from "@/components/molecules/logout-confirm-modal";
import { RedirectingScreen, WaitingReturnScreen } from "@/components/auth-ux";
import { LoginModal } from "@/components/common/LoginModal";
import { SuccessScreen } from "@/components/molecules/auth-ux/SuccessScreen";
import { CancelScreen } from "@/components/molecules/auth-ux/CancelScreen";
import { ErrorScreen } from "@/components/molecules/auth-ux/ErrorScreen";
import { useAuthUxMachine } from "@/hooks/use-auth-ux-machine";
import { WelcomeMessage } from "@/components/common/WelcomeMessage";
import * as Haptics from "expo-haptics";

// キャラクター画像
const characterImages = {
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
};

interface GlobalMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export function GlobalMenu({ isVisible, onClose }: GlobalMenuProps) {
  
  const { user, isAuthenticated, isAuthReadyForUI } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { state, tapLogin, confirmYes, confirmNo, retry, backWithoutLogin, hideWelcome } = useAuthUxMachine();

  const handleHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogin = () => {
    handleHaptic();
    tapLogin();
  };

  const handleLogout = () => {
    handleHaptic();
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onClose();
    navigate.toLogout();
  };

  const handleLinkPress = () => {
    handleHaptic();
    onClose();
  };

  const menuItems = [
    { icon: "home", label: "ホーム", path: "/(tabs)" },
    { icon: "add-circle", label: "チャレンジ作成", path: "/(tabs)/create" },
    { icon: "person", label: "マイページ", path: "/(tabs)/mypage" },
    { icon: "leaderboard", label: "ランキング", path: "/rankings" },
    { icon: "history", label: "アップデート履歴", path: "/release-notes" },
    { icon: "notifications", label: "通知", path: "/notifications" },
    { icon: "settings", label: "設定", path: "/settings" },
  ];

  return (
    <>
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: palette.black + "99", // 60% opacity
          }}
          onPress={onClose}
        >
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 280,
              height: "100%",
              backgroundColor: color.surface,
              shadowColor: palette.black,
              shadowOffset: { width: -2, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView style={{ flex: 1 }}>
              {/* ヘッダー */}
              <View
                style={{
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: color.borderAlt,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold" }}>
                    メニュー
                  </Text>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color.borderAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
                  >
                    <MaterialIcons name="close" size={20} color={color.textMuted} />
                  </Pressable>
                </View>
              </View>

              {/* ユーザー情報（認証確定後のみ表示して点滅防止） */}
              <View
                style={{
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: color.borderAlt,
                }}
              >
                {!isAuthReadyForUI ? (
                  <View style={{ minHeight: 48, justifyContent: "center" }}>
                    <Text style={{ color: color.textMuted, fontSize: 14 }}>読み込み中...</Text>
                  </View>
                ) : isAuthReadyForUI && isAuthenticated && user ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {user.profileImage ? (
                      <Image
                        source={{ uri: user.profileImage }}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          marginRight: 12,
                        }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: color.borderAlt,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <MaterialIcons name="person" size={24} color={color.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: color.textWhite,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                        numberOfLines={1}
                      >
                        {user.name || user.username || "ゲスト"}
                      </Text>
                      {user.username && (
                        <Text
                          style={{
                            color: color.textMuted,
                            fontSize: 14,
                          }}
                          numberOfLines={1}
                        >
                          @{user.username}
                        </Text>
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: color.successDark,
                            marginRight: 6,
                          }}
                        />
                        <Text style={{ color: color.successDark, fontSize: 12 }}>
                          ログイン中
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={characterImages.linkYukkuri}
                      style={{ width: 60, height: 60, marginBottom: 12 }}
                      contentFit="contain"
                    />
                    <Text
                      style={{
                        color: color.textMuted,
                        fontSize: 14,
                        textAlign: "center",
                        marginBottom: 12,
                      }}
                    >
                      ログインして参加しよう！
                    </Text>
                    <Pressable
                      onPress={handleLogin}
                      style={({ pressed }) => [{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: color.twitter,
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 24,
                        width: "100%",
                      }, pressed && { opacity: 0.7 }]}
                    >
                      <MaterialIcons
                        name="login"
                        size={20}
                        color={color.textWhite}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: color.textWhite,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Xでログイン
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* メニュー項目 - Linkコンポーネントを使用してステータスバーにURL表示 */}
              <View style={{ padding: 12 }}>
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path as any}
                    onPress={handleLinkPress}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      marginBottom: 4,
                      textDecorationLine: "none",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons
                        name={item.icon as any}
                        size={24}
                        color={color.textMuted}
                        style={{ marginRight: 16 }}
                      />
                      <Text style={{ color: color.textWhite, fontSize: 16 }}>
                        {item.label}
                      </Text>
                    </View>
                  </Link>
                ))}
              </View>

              {/* ログアウトボタン */}
              {isAuthenticated && (
                <View
                  style={{
                    padding: 12,
                    borderTopWidth: 1,
                    borderTopColor: color.borderAlt,
                    marginTop: 12,
                  }}
                >
                  <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: palette.red500 + "1A", // 10% opacity
                    }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
                  >
                    <MaterialIcons
                      name="logout"
                      size={20}
                      color={color.danger}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: color.danger,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      ログアウト
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ログアウト確認モーダル */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      {/* ログイン確認モーダル（共通LoginModalに統一） */}
      <LoginModal
        visible={state.name === "confirm"}
        onConfirm={confirmYes}
        onCancel={confirmNo}
      />

      {/* Redirecting画面 (Phase 2 PR-2) */}
      <RedirectingScreen visible={state.name === "redirecting"} onDismiss={backWithoutLogin} />

      {/* WaitingReturn画面 (Phase 2 PR-3) */}
      <WaitingReturnScreen
        visible={state.name === "waitingReturn"}
        remainingMs={
          state.name === "waitingReturn"
            ? state.timeoutMs - (Date.now() - state.startedAt)
            : undefined
        }
      />

      {/* Success画面 (Phase 2 PR-4) */}
      <Modal
        visible={state.name === "success"}
        transparent
        animationType="fade"
      >
        <SuccessScreen onClose={backWithoutLogin} />
      </Modal>

      {/* Cancel画面 (Phase 2 PR-5) */}
      <Modal
        visible={state.name === "cancel"}
        transparent
        animationType="fade"
      >
        <CancelScreen
          kind={state.name === "cancel" ? state.kind : "user"}
          onRetry={retry}
          onBack={backWithoutLogin}
        />
      </Modal>

      {/* Error画面 (Phase 2 PR-6) */}
      <Modal
        visible={state.name === "error"}
        transparent
        animationType="fade"
      >
        <ErrorScreen
          message={state.name === "error" ? state.message : undefined}
          onRetry={retry}
          onBack={backWithoutLogin}
        />
      </Modal>
      
      {/* ウェルカムメッセージ */}
      <WelcomeMessage
        visible={state.name === "showingWelcome"}
        onHide={hideWelcome}
        userName={user?.name || user?.username}
      />
    </>
  );
}

// ハンバーガーメニューボタン
interface HamburgerButtonProps {
  onPress: () => void;
  size?: number;
  buttonColor?: string;
}

export function HamburgerButton({
  onPress,
  size = 24,
  buttonColor = color.textWhite,
}: HamburgerButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
      }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
    >
      <MaterialIcons name="menu" size={size} color={buttonColor} />
    </Pressable>
  );
}
