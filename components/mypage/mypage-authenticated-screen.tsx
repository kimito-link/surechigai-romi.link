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
  ActivityIndicator,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Image } from "expo-image";
import MaterialIcons from "@/lib/icons/material-icons";
import appConfig from "@/app.config.json";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { MySignalSummary } from "@/components/dashboard/my-signal-summary";
import { MypageActionList } from "@/components/dashboard/mypage-action-list";
import { HostEventsSummary } from "@/components/dashboard/host-events-summary";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/lib/tutorial-context";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { trpc } from "@/lib/trpc";
import { color, palette, contentMaxWidth } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import {
  closePreparedSharePopup,
  prepareSharePopup,
  shareMyLocation,
} from "@/lib/share";
import {
  TRAIL_VISIBILITY_VALUES,
  trailVisibilityDescription,
  trailVisibilityLabel,
  type TrailVisibility,
} from "@/modules/encounter/core/trail-visibility";
import { useLivePresenceControls } from "@/hooks/use-live-presence";
import { LocationPauseControl } from "@/components/mypage/location-pause-control";

const MAX_HITOKOTO = 140;

/** ひとことのワンタップ定型文（手入力を減らす）。タップで入力欄に入る。 */
const HITOKOTO_PRESETS = [
  "すれ違えてうれしい！",
  "声かけてOKです",
  "Xフォローしてね",
  "また会いましょう",
  "応援してます！",
  "今日はこのへんにいます",
] as const;

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

            {/* ワンタップ定型文（手入力を減らす） */}
            <Text style={styles.presetLabel}>よく使う言葉（タップで入ります）</Text>
            <View style={styles.presetRow}>
              {HITOKOTO_PRESETS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => { setText(p); setError(""); }}
                  style={({ pressed }) => [styles.presetChip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.presetChipText}>{p}</Text>
                </Pressable>
              ))}
            </View>

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

export function MypageAuthenticatedScreen() {
  const { isDesktop } = useResponsive();
  const { user, logout } = useAuth();
  const tabInset = useTabBarInset();

  const [hitokotoModalVisible, setHitokotoModalVisible] = useState(false);
  const [showBlockList, setShowBlockList] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localHitokoto, setLocalHitokoto] = useState("");
  const { resetTutorial } = useTutorial();
  const { resetOnboarding } = useOnboarding();

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
  const setTrailVisibility = trpc.settings.setTrailVisibility.useMutation();
  const [sharePrecise, setSharePrecise] = useState(false);
  const [trailVisibility, setTrailVisibilityState] = useState<TrailVisibility>("public");
  const { liveEnabled, toggleLivePresence, isPausing, isLoading: livePresenceLoading } =
    useLivePresenceControls();
  const pauseLocationMutation = trpc.settings.pauseLocation.useMutation({
    onSuccess: () => void settingsQuery.refetch(),
  });
  const resumeLocationMutation = trpc.settings.resume.useMutation({
    onSuccess: () => void settingsQuery.refetch(),
  });
  const pausedUntilLabel = isPausing && settingsQuery.data?.locationPausedUntil
    ? new Date(settingsQuery.data.locationPausedUntil).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  useEffect(() => {
    if (settingsQuery.data) {
      setSharePrecise(settingsQuery.data.shareLocationPrecise ?? false);
      const vis = settingsQuery.data.trailVisibility;
      if (
        vis === "private" ||
        vis === "link" ||
        vis === "acquaintance" ||
        vis === "public"
      ) {
        setTrailVisibilityState(vis);
      }
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
    const sharePopup = prepareSharePopup();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const res = await shareSlugMutation.mutateAsync();
      const shared = await shareMyLocation(res.url, res.areaLabel ?? undefined, {
        popup: sharePopup,
      });
      if (!shared) {
        Alert.alert("エラー", "Xの投稿画面を開けませんでした。ポップアップ許可を確認してください。");
      }
    } catch {
      closePreparedSharePopup(sharePopup);
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

  const handleSelectTrailVisibility = useCallback(
    (next: TrailVisibility) => {
      const prev = trailVisibility;
      setTrailVisibilityState(next);
      setTrailVisibility.mutate(
        { visibility: next },
        {
          onError: () => {
            setTrailVisibilityState(prev);
            Alert.alert("エラー", "公開範囲の保存に失敗しました。時間をおいて再度お試しください。");
          },
        },
      );
    },
    [setTrailVisibility, trailVisibility],
  );

  const handleLogout = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logout();
    navigate.toHome();
  }, [logout]);

  const handlePauseLocation = useCallback(
    (hours: number) => {
      pauseLocationMutation.mutate({ hours });
    },
    [pauseLocationMutation],
  );

  const handleResumeLocation = useCallback(() => {
    resumeLocationMutation.mutate();
  }, [resumeLocationMutation]);

  const handleViewPublicPage = useCallback(async () => {
    try {
      const res = await shareSlugMutation.mutateAsync();
      navigate.toPublicTrail(res.slug);
    } catch {
      Alert.alert("エラー", "公開ページの取得に失敗しました。時間をおいて再度お試しください。");
    }
  }, [shareSlugMutation]);

  if (!user) {
    return null;
  }

  const hitokotoDisplay = localHitokoto || "(ひとこと未設定)";

  return (
    <ScreenContainer containerClassName="bg-background">
      <TabScreenHeader
        title="マイページ"
        contextKey="mypage"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: tabInset }]}>
        <View style={styles.pageBody}>
        {/* プロフィールカード */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder]}>
                <MaterialIcons name="account-circle" size={48} color={color.textMuted} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.name || user.username || "ロミユーザー"}
              </Text>
              {user.username && (
                <Text style={styles.profileUsername} numberOfLines={1}>@{user.username}</Text>
              )}
              {typeof user.followersCount === "number" ? (
                <Text style={styles.profileMetaText}>
                  フォロワー {user.followersCount.toLocaleString("ja-JP")}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.profileActionsRow}>
            <Pressable
              onPress={handleViewPublicPage}
              disabled={shareSlugMutation.isPending}
              style={({ pressed }) => [
                styles.publicPagePreviewLink,
                pressed && { opacity: 0.7 },
                shareSlugMutation.isPending && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
            >
              <MaterialIcons name="visibility" size={16} color={color.accentIndigo} />
              <Text style={styles.publicPagePreviewText}>
                {shareSlugMutation.isPending ? "準備中…" : "公開ページを見る"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleShareLocation}
              disabled={shareSlugMutation.isPending}
              style={({ pressed }) => [
                styles.publicPagePreviewLink,
                pressed && { opacity: 0.7 },
                shareSlugMutation.isPending && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
            >
              <MaterialIcons name="ios-share" size={16} color={color.accentIndigo} />
              <Text style={styles.publicPagePreviewText}>
                {shareSlugMutation.isPending ? "準備中…" : "現在地をXでシェア"}
              </Text>
            </Pressable>
          </View>
        </View>

        <MypageActionList />
        <MySignalSummary />
        <HostEventsSummary />

        {/* 設定（折りたたみ） */}
        <View style={styles.section}>
          <Pressable
            onPress={() => setSettingsOpen(!settingsOpen)}
            style={({ pressed }) => [styles.sectionHeader, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityState={{ expanded: settingsOpen }}
          >
            <Text style={styles.sectionTitle}>設定</Text>
            <MaterialIcons
              name={settingsOpen ? "expand-less" : "expand-more"}
              size={20}
              color={color.textMuted}
            />
          </Pressable>

          {settingsOpen ? (
            <View style={styles.settingsBody}>
        {/* 現在地をXでシェアはプロフィールカードへ移設済み（行動は設定に置かない方針） */}

        {/* 共有サムネの粒度設定 */}
        <View style={styles.precisionRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
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

        {/* 居場所をリアルタイム公開（レーダー） */}
        <View style={styles.precisionRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <Text style={styles.precisionTitle}>居場所をリアルタイム公開</Text>
            <Text style={styles.precisionSub}>
              {isPausing
                ? "位置情報が一時停止中のため利用できません"
                : liveEnabled
                  ? "ONの間、レーダー上で「いまここにいるよ」と表示されます（約45秒ごとに更新）"
                  : "OFFの間は他の人にリアルタイムの居場所は表示されません"}
            </Text>
          </View>
          <Switch
            value={liveEnabled}
            onValueChange={toggleLivePresence}
            disabled={settingsQuery.isLoading || livePresenceLoading || isPausing}
            trackColor={{ false: palette.gray400, true: palette.kimitoBlue }}
            thumbColor={palette.white}
          />
        </View>

        {/* 軌跡の公開範囲 */}
        <View style={styles.visibilitySection}>
          <Text style={styles.visibilityHeading}>軌跡の公開範囲</Text>
          <Text style={styles.visibilityNote}>
            記録自体は残ります。交流はXで行い、アプリ内DMはありません。
          </Text>
          {TRAIL_VISIBILITY_VALUES.map((value) => {
            const selected = trailVisibility === value;
            return (
              <Pressable
                key={value}
                onPress={() => handleSelectTrailVisibility(value)}
                disabled={settingsQuery.isLoading || setTrailVisibility.isPending}
                style={({ pressed }) => [
                  styles.visibilityOption,
                  selected && styles.visibilityOptionSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <MaterialIcons
                  name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                  size={20}
                  color={selected ? palette.kimitoBlue : color.textMuted}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.visibilityTitle, selected && styles.visibilityTitleSelected]}>
                    {trailVisibilityLabel(value)}
                  </Text>
                  <Text style={styles.visibilitySub}>
                    {trailVisibilityDescription(value)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 足あとの一時停止（docs/uiux-brushup-SPEC.md §6.3） */}
        <View style={styles.section}>
          <LocationPauseControl
            isPausing={isPausing}
            pausedUntilLabel={pausedUntilLabel}
            isBusy={pauseLocationMutation.isPending || resumeLocationMutation.isPending}
            onPause={handlePauseLocation}
            onResume={handleResumeLocation}
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
        <View style={styles.settingsSubSection}>
          <Text style={styles.settingsSubHeading}>その他</Text>

          <Pressable
            onPress={() => void resetTutorial()}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="school" size={20} color={palette.kimitoBlue} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemText, { color: color.textPrimary }]}>使い方ガイドをもう一度</Text>
              <Text style={{ color: color.textMuted, fontSize: 11, marginTop: 2 }}>
                封筒・チェックイン・現在地・ナビ・集まりの6ステップ
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => void resetOnboarding()}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="auto-stories" size={20} color={palette.kimitoBlue} style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: color.textPrimary }]}>初回スライドをもう一度</Text>
          </Pressable>

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

          <View style={styles.dangerZoneDivider} />

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
            </View>
          ) : null}
        </View>
        </View>
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
  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
    alignItems: "center",
  },
  pageBody: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    gap: 12,
  },
  // Profile card
  profileCard: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  publicPagePreviewLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
  },
  publicPagePreviewText: {
    color: color.accentIndigo,
    fontSize: 13,
    fontWeight: "700",
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
  visibilitySection: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  visibilityHeading: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  visibilityNote: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  visibilityOptionSelected: {
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlue + "12",
  },
  visibilityTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  visibilityTitleSelected: {
    color: palette.kimitoBlue,
  },
  visibilitySub: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  profileUsername: {
    color: color.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  profileMetaText: {
    color: color.textMuted,
    fontSize: 11,
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
  settingsBody: {
    gap: 12,
    marginTop: 8,
  },
  settingsSubSection: {
    gap: 4,
    marginTop: 4,
  },
  settingsSubHeading: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
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
  dangerZoneDivider: {
    height: 1,
    backgroundColor: color.border,
    marginVertical: 16,
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
  presetLabel: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  presetChipText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
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
