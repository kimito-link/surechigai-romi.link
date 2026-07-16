/**
 * マイページ画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * - Xアイコン/名前
 * - ひとこと編集（24h表示の説明付き）
 * - ブロックリスト管理（safety.unblock）
 * - ログアウト
 * - 利用規約/プライバシーポリシーリンク（プレースホルダ）
 *
 * 見た目(JSX)は mypage-screen-view.tsx に切り出し済み
 * (refactor-instructions.md Phase 7 Debt #11)。
 */

import { View, Text, Platform, Pressable, Alert } from "react-native";
import { useState, useCallback, useEffect } from "react";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/lib/tutorial-context";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import {
  closePreparedSharePopup,
  prepareSharePopup,
  shareMyLocation,
} from "@/lib/share";
import type { TrailVisibility } from "@/modules/encounter/core/trail-visibility";
import { useLivePresenceControls } from "@/hooks/use-live-presence";
import { MypageScreenView } from "@/components/mypage/mypage-screen-view";
import { styles } from "@/components/mypage/mypage-screen-styles";

/** ブロックリストアイテム(現状JSXからは未使用。safety.unblock実装時に使う想定) */
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
    <MypageScreenView
      isDesktop={isDesktop}
      user={user}
      tabInset={tabInset}
      hitokotoDisplay={hitokotoDisplay}
      isSharing={shareSlugMutation.isPending}
      handleViewPublicPage={handleViewPublicPage}
      handleShareLocation={handleShareLocation}
      settingsOpen={settingsOpen}
      setSettingsOpen={setSettingsOpen}
      sharePrecise={sharePrecise}
      handleTogglePrecision={handleTogglePrecision}
      settingsLoading={settingsQuery.isLoading}
      isSetSharePrecisionPending={setSharePrecision.isPending}
      isPausing={isPausing}
      liveEnabled={liveEnabled}
      toggleLivePresence={toggleLivePresence}
      livePresenceLoading={livePresenceLoading}
      trailVisibility={trailVisibility}
      handleSelectTrailVisibility={handleSelectTrailVisibility}
      isSetTrailVisibilityPending={setTrailVisibility.isPending}
      pausedUntilLabel={pausedUntilLabel}
      isPauseOrResumePending={
        pauseLocationMutation.isPending || resumeLocationMutation.isPending
      }
      handlePauseLocation={handlePauseLocation}
      handleResumeLocation={handleResumeLocation}
      hitokotoModalVisible={hitokotoModalVisible}
      setHitokotoModalVisible={setHitokotoModalVisible}
      localHitokoto={localHitokoto}
      handleHitokotoSave={handleHitokotoSave}
      showBlockList={showBlockList}
      setShowBlockList={setShowBlockList}
      resetTutorial={resetTutorial}
      resetOnboarding={resetOnboarding}
      handleLogout={handleLogout}
    />
  );
}
