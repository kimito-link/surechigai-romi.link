/**
 * マイページ画面
 * 君斗りんくのすれ違ひ通信 MVP
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
  TextInput,
  StyleSheet,
  Modal,
  Linking,
  Platform,
  Alert,
  Pressable,
  Switch,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import appConfig from "@/app.config.json";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { GlobalLoginGate } from "@/components/organisms/global-login-gate";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import { shareMyLocation } from "@/lib/share";

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

import { useRouter } from "expo-router";

export default function MypageScreen() {
  const { isDesktop } = useResponsive();
  const { user, isAuthenticated, isAuthReady, logout } = useAuth();
  const router = useRouter();

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

  // 現在地シェア（/u/<slug> をXで共有 → 地図サムネ付きOGP）
  const shareSlugMutation = trpc.ogp.getOrCreateShareSlug.useMutation();

  // 共有サムネの粒度設定（false=市区町村 / true=正確座標）
  const settingsQuery = trpc.settings.get.useQuery();
  const setSharePrecision = trpc.settings.setSharePrecision.useMutation();
  const [sharePrecise, setSharePrecise] = useState(false);
  useEffect(() => {
    if (settingsQuery.data) {
      setSharePrecise(settingsQuery.data.shareLocationPrecise ?? false);
    }
  }, [settingsQuery.data]);

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

  const handleShareLocation = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const res = await shareSlugMutation.mutateAsync();
      await shareMyLocation(res.url, res.areaLabel ?? undefined);
    } catch {
      Alert.alert("エラー", "共有リンクの作成に失敗しました。時間をおいて再度お試しください。");
    }
  }, [shareSlugMutation]);

  const handleTogglePrecision = useCallback(
    (next: boolean) => {
      setSharePrecise(next);
      setSharePrecision.mutate(
        { precise: next },
        {
          onError: () => {
            setSharePrecise(!next);
            Alert.alert("エラー", "設定の保存に失敗しました。時間をおいて再度お試しください。");
          },
        },
      );
    },
    [setSharePrecision],
  );

  const handleLogout = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logout();
    navigate.toHome();
  }, [logout]);

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader 
          title="マイページ" 
          showCharacters={false} 
          isDesktop={isDesktop} 
          showMenu 
          leftElement={
            <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
              <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
        />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <GlobalLoginGate
        title="プロフィール設定"
        subtitle="ログインしてプロフィールを設定してください"
        headerTitle="マイページ"
        isDesktop={isDesktop}
      />
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
        leftElement={
          <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
            <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
          </Pressable>
        }
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
            <View style={styles.profileMetaRow}>
              {user.twitterId && (
                <Text style={styles.profileMetaText}>ID {user.twitterId}</Text>
              )}
              <Text style={styles.profileMetaText}>
                フォロワー {typeof user.followersCount === "number" ? user.followersCount.toLocaleString("ja-JP") : "取得中"}
              </Text>
            </View>
          </View>
        </View>

        {/* 現在地をXでシェア（地図サムネ付きOGP） */}
        <Pressable
          onPress={handleShareLocation}
          disabled={shareSlugMutation.isPending}
          style={({ pressed }) => [
            styles.shareLocationButton,
            pressed && { opacity: 0.85 },
            shareSlugMutation.isPending && { opacity: 0.6 },
          ]}
        >
          <MaterialIcons name="share-location" size={22} color={color.textWhite} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shareLocationTitle}>
              {shareSlugMutation.isPending ? "リンクを準備中…" : "現在地をXでシェア"}
            </Text>
            <Text style={styles.shareLocationSub}>地図サムネ付きで「いまいる場所」を共有</Text>
          </View>
          <MaterialIcons name="open-in-new" size={16} color="rgba(255,255,255,0.85)" />
        </Pressable>

        {/* 共有サムネの粒度設定 */}
        <View style={styles.precisionRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.precisionTitle}>正確な現在地で共有する</Text>
            <Text style={styles.precisionSub}>
              {sharePrecise
                ? "サムネに正確な座標を表示します（後でその場所に行ける精度）"
                : "OFFの間は市区町村レベル（約500m）で安全側に表示します"}
            </Text>
          </View>
          <Switch
            value={sharePrecise}
            onValueChange={handleTogglePrecision}
            disabled={settingsQuery.isLoading || setSharePrecision.isPending}
            trackColor={{ false: palette.gray400, true: palette.kimitoBlue }}
            thumbColor={palette.white}
          />
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
            onPress={navigate.toSpecialThanks}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="stars" size={20} color={color.accentAlt} style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: color.textPrimary }]}>Special Thanks</Text>
          </Pressable>

          {/* 姉妹サービス導線：同じアカウント(シグナルID)でそのまま接続できる別サービスへ。 */}
          {(appConfig.siblingServices ?? []).map((svc) => (
            <Pressable
              key={svc.url}
              onPress={() => Linking.openURL(svc.url)}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="hub" size={20} color={color.accentAlt} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: color.textPrimary }]}>{svc.name}</Text>
                {svc.sharedAccount && (
                  <Text style={{ color: color.textMuted, fontSize: 11, marginTop: 2 }}>
                    同じアカウントで接続 / 登録不要
                  </Text>
                )}
              </View>
              <MaterialIcons name="open-in-new" size={16} color={color.textMuted} />
            </Pressable>
          ))}

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

        <Text style={styles.version}>君斗りんくのすれ違ひ通信 v1.0.0</Text>
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
  // 現在地シェアボタン
  shareLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.black,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  shareLocationTitle: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  shareLocationSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  precisionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  precisionTitle: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  precisionSub: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
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
  profileMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  profileMetaText: {
    color: color.successDark,
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: palette.black,
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
