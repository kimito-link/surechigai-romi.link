/**
 * グローバルメニュー
 * 君斗りんくのすれ違ひ通信: シンプルなナビゲーションメニュー
 */
import { useState } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, Modal, Pressable, ScrollView, Platform } from "react-native";
import { Link } from "expo-router";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { UserAccountChip } from "@/components/molecules/user-account-chip";
import { LogoutConfirmModal } from "@/components/molecules/logout-confirm-modal";
import { useTextScale } from "@/lib/text-scale";
import * as Haptics from "expo-haptics";

interface GlobalMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export function GlobalMenu({ isVisible, onClose }: GlobalMenuProps) {
  const { user, isAuthenticated, isAuthReadyForUI } = useAuth();
  const openLoginGuide = useLoginGuide();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { isLarge, toggle: toggleTextSize } = useTextScale();

  const handleToggleTextSize = () => {
    handleHaptic();
    toggleTextSize();
  };

  const handleHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogin = () => {
    handleHaptic();
    onClose();
    openLoginGuide();
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
    { icon: "groups", label: "訪問申告", path: "/visit" },
    { icon: "location-on", label: "チェックイン", path: "/(tabs)/checkin" },
    { icon: "book", label: "図鑑", path: "/(tabs)/zukan" },
    { icon: "map", label: "軌跡", path: "/(tabs)/map" },
    { icon: "event", label: "集まり", path: "/(tabs)/events" },
    { icon: "person", label: "マイページ", path: "/(tabs)/mypage" },
  ];

  return (
    <>
      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable
          style={{ flex: 1, backgroundColor: palette.black + "99" }}
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
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: color.borderAlt }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: color.textPrimary, fontSize: 13, fontWeight: "bold" }}>メニュー (君斗りんくのすれ違ひ通信 v1.0.0)</Text>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: color.borderAlt,
                      alignItems: "center", justifyContent: "center",
                    }, pressed && { opacity: 0.7 }]}
                  >
                    <MaterialIcons name="close" size={20} color={color.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* ユーザー情報 */}
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: color.borderAlt }}>
                {!isAuthReadyForUI ? (
                  <Text style={{ color: color.textMuted, fontSize: 14 }}>読み込み中...</Text>
                ) : isAuthenticated && user ? (
                  <UserAccountChip user={user} />
                ) : (
                  <Pressable
                    onPress={handleLogin}
                    style={({ pressed }) => [{
                      flexDirection: "row", alignItems: "center", justifyContent: "center",
                      backgroundColor: palette.black,
                      paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
                    }, pressed && { opacity: 0.85 }]}
                  >
                    <MaterialIcons name="login" size={20} color={palette.white} style={{ marginRight: 8 }} />
                    <Text style={{ color: palette.white, fontSize: 16, fontWeight: "700" }}>
                      Xでログイン
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* かんたん表示（文字を大きくする）。PCやスマホに不慣れな人向け。 */}
              <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                <Pressable
                  onPress={handleToggleTextSize}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isLarge }}
                  style={({ pressed }) => [{
                    flexDirection: "row", alignItems: "center",
                    minHeight: 52, paddingHorizontal: 14, borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isLarge ? palette.kimitoOrange : color.borderAlt,
                    backgroundColor: isLarge ? palette.kimitoOrange + "1A" : color.surfaceAlt,
                  }, pressed && { opacity: 0.7 }]}
                >
                  <MaterialIcons
                    name="format-size"
                    size={24}
                    color={isLarge ? palette.kimitoOrange : palette.kimitoBlue}
                    style={{ marginRight: 14 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: color.textPrimary, fontSize: 16, fontWeight: "700" }}>
                      {isLarge ? "文字を元に戻す" : "文字を大きくする"}
                    </Text>
                    <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
                      読みやすい大きさに切り替えます
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 44, height: 26, borderRadius: 13, padding: 3,
                      backgroundColor: isLarge ? palette.kimitoOrange : color.border,
                      alignItems: isLarge ? "flex-end" : "flex-start",
                    }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: palette.white }} />
                  </View>
                </Pressable>
              </View>

              {/* メニュー項目 */}
              <View style={{ padding: 12 }}>
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path as any}
                    asChild
                  >
                    <Pressable
                      onPress={handleLinkPress}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        marginBottom: 4,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <MaterialIcons name={item.icon as any} size={24} color={palette.kimitoBlue} style={{ marginRight: 16 }} />
                      <Text style={{ color: color.textPrimary, fontSize: 16 }}>{item.label}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>

              {/* ログアウトボタン */}
              {isAuthenticated && (
                <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: color.borderAlt, marginTop: 12 }}>
                  <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [{
                      flexDirection: "row", alignItems: "center", justifyContent: "center",
                      paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12,
                      backgroundColor: palette.red500 + "1A",
                    }, pressed && { opacity: 0.7 }]}
                  >
                    <MaterialIcons name="logout" size={20} color={color.danger} style={{ marginRight: 8 }} />
                    <Text style={{ color: color.danger, fontSize: 16, fontWeight: "600" }}>ログアウト</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <LogoutConfirmModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

    </>
  );
}

export function HamburgerButton({ onPress, size = 24, buttonColor = palette.kimitoBlue }: { onPress: () => void; size?: number; buttonColor?: string }) {
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
        width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22,
      }, pressed && { opacity: 0.7 }]}
    >
      <MaterialIcons name="menu" size={size} color={buttonColor} />
    </Pressable>
  );
}
