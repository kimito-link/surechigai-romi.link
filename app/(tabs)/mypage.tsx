/**
 * マイページ画面
 * すれちがいロミ MVP
 *
 * - Xアイコン/名前
 * - ひとこと編集（24h表示の説明付き）
 * - ブロックリスト管理（safety.unblock）
 * - ログアウト
 * - 利用規約/プライバシーポリシーリンク（プレースホルダ）
 */

import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Modal,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";

const MAX_HITOKOTO = 140;

/** ひとこと編集モーダル */
function HitokotoModal({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(current);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (text.length > MAX_HITOKOTO) {
      setError(`${MAX_HITOKOTO}文字以内で入力してください`);
      return;
    }
    onSave(text);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.hitokotoModal}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.hitokotoModalTitle}>ひとこと編集</Text>
            <Text style={styles.hitokotoHint}>
              24時間だけすれ違い相手に表示されます
            </Text>

            <TextInput
              value={text}
              onChangeText={(t) => { setText(t); setError(""); }}
              placeholder="一言どうぞ..."
              placeholderTextColor={color.textMuted}
              maxLength={MAX_HITOKOTO}
              multiline
              numberOfLines={4}
              style={styles.hitokotoInput}
              autoFocus
            />

            <View style={styles.hitokotoFooter}>
              <Text style={[styles.hitokotoCount, text.length > MAX_HITOKOTO * 0.9 && { color: color.danger }]}>
                {text.length}/{MAX_HITOKOTO}
              </Text>
              {error ? <Text style={styles.hitokotoError}>{error}</Text> : null}
            </View>

            <View style={styles.hitokotoButtons}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

/** ブロックリストアイテム */
function BlockedUserRow({
  userId,
  onUnblock,
}: {
  userId: number;
  onUnblock: (userId: number) => void;
}) {
  return (
    <View style={styles.blockedRow}>
      <View style={styles.blockedAvatar}>
        <MaterialIcons name="account-circle" size={36} color={color.textMuted} />
      </View>
      <View style={styles.blockedInfo}>
        <Text style={styles.blockedName}>ユーザー #{userId}</Text>
      </View>
      <Pressable
        onPress={() => onUnblock(userId)}
        style={({ pressed }) => [styles.unblockButton, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.unblockButtonText}>解除</Text>
      </Pressable>
    </View>
  );
}

export default function MypageScreen() {
  const { isDesktop } = useResponsive();
  const { user, isAuthenticated, isAuthReadyForUI, logout, login } = useAuth();

  const [hitokotoModalVisible, setHitokotoModalVisible] = useState(false);
  const [showBlockList, setShowBlockList] = useState(false);
  const [localHitokoto, setLocalHitokoto] = useState("");

  const updateHitokoto = trpc.encounter.updateHitokoto.useMutation({
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (err) => {
      Alert.alert("エラー", err.message || "ひとことの更新に失敗しました");
    },
  });

  // ブロックリスト（encounters から相手IDを一意にするのが正規だが、
  // MVP では blocks テーブルを直接取得する API なし → 簡易プレースホルダ）
  const unblockMutation = trpc.safety.unblock.useMutation();

  const handleHitokotoSave = useCallback(
    (text: string) => {
      setLocalHitokoto(text);
      updateHitokoto.mutate({ text });
    },
    [updateHitokoto],
  );

  const handleUnblock = useCallback(
    (userId: number) => {
      unblockMutation.mutate({ userId });
    },
    [unblockMutation],
  );

  const handleLogout = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logout();
    navigate.toHome();
  }, [logout]);

  if (!isAuthReadyForUI) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader title="マイページ" showCharacters={false} isDesktop={isDesktop} showMenu />
        <View style={styles.center}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader title="マイページ" showCharacters={false} isDesktop={isDesktop} showMenu showLoginButton />
        <View style={styles.loginGate}>
          <MaterialIcons name="account-circle" size={64} color={color.accentPrimary} />
          <Text style={styles.loginGateTitle}>ログインして{"\n"}プロフィールを設定</Text>
          <Pressable
            onPress={() => login()}
            style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="login" size={20} color={color.textWhite} style={{ marginRight: 8 }} />
            <Text style={styles.loginButtonText}>X（Twitter）でログイン</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const hitokotoDisplay = localHitokoto || "(ひとこと未設定)";

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="マイページ"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* プロフィールカード */}
        <View style={styles.profileCard}>
          {user.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder]}>
              <MaterialIcons name="account-circle" size={64} color={color.textMuted} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user.name || user.username || "ロミユーザー"}
            </Text>
            {user.username && (
              <Text style={styles.profileUsername}>@{user.username}</Text>
            )}
          </View>
        </View>

        {/* ひとこと */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ひとこと</Text>
            <Pressable
              onPress={() => setHitokotoModalVisible(true)}
              style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="edit" size={16} color={color.accentIndigo} />
              <Text style={styles.editButtonText}>編集</Text>
            </Pressable>
          </View>
          <Text style={styles.hitokotoDisplay}>{hitokotoDisplay}</Text>
          <Text style={styles.hitokotoNote}>
            すれ違い相手に24時間だけ表示されます
          </Text>
        </View>

        {/* ブロックリスト */}
        <View style={styles.section}>
          <Pressable
            onPress={() => setShowBlockList(!showBlockList)}
            style={({ pressed }) => [styles.sectionHeader, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.sectionTitle}>ブロックリスト</Text>
            <MaterialIcons
              name={showBlockList ? "expand-less" : "expand-more"}
              size={20}
              color={color.textMuted}
            />
          </Pressable>
          {showBlockList && (
            <View style={styles.blockListContent}>
              <Text style={styles.blockListEmpty}>
                ブロックしているユーザーはいません
              </Text>
            </View>
          )}
        </View>

        {/* 設定・ログアウト */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.menuItem, styles.dangerItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="logout" size={20} color={color.danger} style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: color.danger }]}>ログアウト</Text>
          </Pressable>
        </View>

        {/* リーガルリンク */}
        <View style={styles.legalSection}>
          <Pressable
            onPress={() => Linking.openURL("https://surechigai-romi.link/terms")}
            style={({ pressed }) => [styles.legalLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.legalLinkText}>利用規約</Text>
          </Pressable>
          <Text style={styles.legalSep}>・</Text>
          <Pressable
            onPress={() => Linking.openURL("https://surechigai-romi.link/privacy")}
            style={({ pressed }) => [styles.legalLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.legalLinkText}>プライバシーポリシー</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>すれちがいロミ MVP</Text>
      </ScrollView>

      {/* ひとこと編集モーダル */}
      <HitokotoModal
        visible={hitokotoModalVisible}
        current={localHitokoto}
        onClose={() => setHitokotoModalVisible(false)}
        onSave={handleHitokotoSave}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: color.textMuted,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  // Profile card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
  },
  profileUsername: {
    color: color.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  // Section
  section: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: color.accentIndigo + "22",
  },
  editButtonText: {
    color: color.accentIndigo,
    fontSize: 12,
    fontWeight: "600",
  },
  hitokotoDisplay: {
    color: color.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  hitokotoNote: {
    color: color.textMuted,
    fontSize: 11,
  },
  // Block list
  blockListContent: {
    paddingVertical: 8,
  },
  blockListEmpty: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  blockedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    color: color.textPrimary,
    fontSize: 14,
  },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
  },
  unblockButtonText: {
    color: color.textMuted,
    fontSize: 12,
  },
  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  dangerItem: {
    backgroundColor: color.danger + "11",
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Legal
  legalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  legalLink: {
    padding: 4,
  },
  legalLinkText: {
    color: color.textMuted,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalSep: {
    color: color.textMuted,
    fontSize: 12,
  },
  version: {
    color: color.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "CC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hitokotoModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  hitokotoModalTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  hitokotoHint: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  hitokotoInput: {
    backgroundColor: color.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    color: color.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: color.border,
  },
  hitokotoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hitokotoCount: {
    color: color.textMuted,
    fontSize: 12,
  },
  hitokotoError: {
    color: color.danger,
    fontSize: 12,
  },
  hitokotoButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: color.textMuted,
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: color.accentIndigo,
    alignItems: "center",
  },
  saveButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  // Login gate
  loginGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loginGateTitle: {
    color: color.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.twitter,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  loginButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
});
