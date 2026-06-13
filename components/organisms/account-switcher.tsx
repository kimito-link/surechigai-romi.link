/**
 * アカウント切り替えUIコンポーネント
 * 別のTwitterアカウントでログインする機能を提供
 * 保存済みアカウントのワンタップ切り替えをサポート
 */

import React, { useState } from "react";
import { commonCopy } from "@/constants/copy/common";
import { color, palette } from "@/theme/tokens";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/components/atoms/toast";
import { SavedAccount, setCurrentAccount, formatLastUsed } from "@/lib/account-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Auth from "@/lib/_core/auth";
import { redirectToTwitterSwitchAccount, clearSession } from "@/lib/api";

interface AccountSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSwitcher({ visible, onClose }: AccountSwitcherProps) {
  const colors = useColors();
  const { accounts, currentAccountId, deleteAccount, refreshAccounts } = useAccounts();
  const { user, logout, refresh, isAuthReady } = useAuth();
  const { showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  // 別のアカウントでログイン（新規アカウント追加）
  const handleAddNewAccount = async () => {
    setIsLoading(true);
    try {
      // 1. 現在のセッションをログアウト
      await logout();
      
      // 2. ローカルストレージのセッション情報をクリア
      await AsyncStorage.removeItem("twitter_session");
      await AsyncStorage.removeItem("refresh_token");
      await AsyncStorage.removeItem("access_token");
      
      // 3. ブラウザのクッキーをクリア（Web環境の場合）
      if (Platform.OS === "web") {
        const result = await clearSession();
        if (!result.ok) {
          // Session clear failed (non-fatal)
        }
      }
      
      // 4. モーダルを閉じる
      onClose();
      
      // 5. forceSwitch=trueで別のアカウントでログイン
      // lib/api/twitter-auth.tsの関数を使用（URL構築を一元管理）
      setTimeout(() => {
        try {
          redirectToTwitterSwitchAccount();
        } catch (e) {
          console.error("[AccountSwitcher] Login redirect failed:", e);
        }
      }, 300);
    } catch (error) {
      console.error("[AccountSwitcher] Failed to add new account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存済みアカウントにワンタップで切り替え
  const handleSwitchToAccount = async (account: SavedAccount) => {
    setSwitchingAccountId(account.id);
    try {
      // 1. 現在のセッションをクリア（ログアウトはしない）
      await AsyncStorage.removeItem("twitter_session");
      
      // 2. 選択したアカウントを現在のアカウントに設定
      await setCurrentAccount(account.id);
      
      // 3. ユーザー情報を更新
      const userInfo: Auth.User = {
        id: parseInt(account.id) || 0,
        openId: `twitter:${account.id}`,
        name: account.displayName,
        email: null,
        loginMethod: "twitter",
        lastSignedIn: new Date(),
        username: account.username,
        profileImage: account.profileImageUrl,
      };
      await Auth.setUserInfo(userInfo);
      
      // 4. アカウント一覧を更新
      await refreshAccounts();
      
      // 5. 認証状態を更新
      await refresh();
      
      // 6. モーダルを閉じる
      onClose();
      
      // 7. トースト通知を表示
      setTimeout(() => {
        showSuccess(`${account.displayName}さんに切り替えました`);
      }, 300);
    } catch (error) {
      console.error("[AccountSwitcher] Failed to switch account:", error);
      Alert.alert(commonCopy.alerts.error, "アカウントの切り替えに失敗しました");
    } finally {
      setSwitchingAccountId(null);
    }
  };

  // アカウントを削除
  const handleRemoveAccount = async (accountId: string, username: string) => {
    if (Platform.OS === "web") {
      if (confirm(`@${username}のアカウント情報を削除しますか？`)) {
        await deleteAccount(accountId);
      }
    } else {
      Alert.alert(
        "アカウント削除",
        `@${username}のアカウント情報を削除しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: () => deleteAccount(accountId),
          },
        ]
      );
    }
  };

  // ユーザーのプロフィール画像を取得（Auth.User型に対応）
  const getUserProfileImage = () => {
    if (!user) return undefined;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        const userData = localStorage.getItem("twitter_user");
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.profileImage;
        }
      } catch {
        // localStorage parse failed
      }
    }
    return undefined;
  };

  // ユーザー名を取得
  const getUsername = () => {
    if (!user) return "";
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        const userData = localStorage.getItem("twitter_user");
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.username || user.name;
        }
      } catch {
        // localStorage parse failed
      }
    }
    return user.name || "";
  };

  const profileImage = getUserProfileImage();
  const username = getUsername();
  
  // 現在のアカウント以外の保存済みアカウント
  const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              アカウント切り替え
            </Text>
            <Pressable 
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={({ pressed }) => pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }}
            >
              <Text style={[styles.closeButton, { color: colors.muted }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.accountList} showsVerticalScrollIndicator={false}>
            {/* 現在のアカウント（認証確定後のみで点滅防止） */}
            {isAuthReady && user && (
              <View
                style={[
                  styles.accountItem,
                  styles.currentAccount,
                  { borderColor: colors.primary },
                ]}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                    <MaterialIcons name="person" size={24} color={colors.foreground} />
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={[styles.displayName, { color: colors.foreground }]}>
                    {user.name}
                  </Text>
                  {username && (
                    <Text style={[styles.username, { color: colors.muted }]}>
                      @{username}
                    </Text>
                  )}
                </View>
                <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.currentBadgeText}>現在</Text>
                </View>
              </View>
            )}

            {/* 保存済みの他のアカウント（ワンタップ切り替え可能） */}
            {otherAccounts.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                  保存済みアカウント
                </Text>
              </View>
            )}
            
            {otherAccounts.map((account) => (
              <Pressable
                key={account.id}
                style={({ pressed }) => [
                  styles.accountItem,
                  { borderColor: colors.border },
                  pressed && switchingAccountId !== account.id && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleSwitchToAccount(account);
                }}
                disabled={switchingAccountId === account.id}
              >
                {account.profileImageUrl ? (
                  <Image
                    source={{ uri: account.profileImageUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                    <MaterialIcons name="person" size={24} color={colors.foreground} />
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={[styles.displayName, { color: colors.foreground }]}>
                    {account.displayName}
                  </Text>
                  <View style={styles.usernameRow}>
                    <Text style={[styles.username, { color: colors.muted }]}>
                      @{account.username}
                    </Text>
                    <Text style={[styles.lastUsed, { color: colors.muted }]}>
                      ・{formatLastUsed(account.lastUsed)}
                    </Text>
                  </View>
                </View>
                {switchingAccountId === account.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View style={styles.accountActions}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleRemoveAccount(account.id, account.username);
                      }}
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                      ]}
                    >
                      <MaterialIcons name="close" size={18} color={colors.error} />
                    </Pressable>
                    <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>

          {/* 注意事項 */}
          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <MaterialIcons name="info-outline" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.muted }]}>
              {otherAccounts.length > 0
                ? "保存済みアカウントをタップして切り替え、または新しいアカウントを追加"
                : "Twitterの認証画面で別のアカウントを選択できます"}
            </Text>
          </View>

          {/* 別のアカウントでログインボタン */}
          <Pressable
            style={({ pressed }) => [
              styles.switchButton,
              { backgroundColor: palette.blue500 },
              pressed && !isLoading && { opacity: 0.7 },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleAddNewAccount();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={color.textWhite} size="small" />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color={color.textWhite} />
                <Text style={styles.switchButtonText}>
                  新しいアカウントを追加
                </Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "99",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 20,
    padding: 4,
  },
  accountList: {
    maxHeight: 300,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  currentAccount: {
    borderWidth: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  lastUsed: {
    fontSize: 12,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  accountActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeButton: {
    padding: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  switchButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  switchButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});
