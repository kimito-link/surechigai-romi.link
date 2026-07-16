/**
 * ポスト画面（封筒一覧）
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * - 未開封の封筒を積み重ね演出（強調表示）
 * - タップで開封アニメーション → 相手カード表示
 * - 開封済みは履歴リスト
 * - pull-to-refresh
 * - 未ログイン時: X ログイン誘導
 *
 * 見た目(JSX)は post-screen-view.tsx に切り出し済み
 * (refactor-instructions.md Phase 7 Debt #11)。
 */

import { View, Text, Pressable, Platform, useWindowDimensions, InteractionManager } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/atoms/toast";
import { useScreenContextBar } from "@/hooks/use-screen-context-bar";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { type EncounterItem } from "@/lib/post/encounter-shared";
import type { SignalAccountItem } from "@/components/organisms/signal-account-grid";
import { LazySignalAccountGrid } from "@/lib/lazy-heavy-components";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useMySignal } from "@/hooks/use-my-signal";
import { LIVE_PRESENCE_PULSE_INTERVAL_MS } from "@/modules/encounter/core/live-presence";
import { CheckinCtaButton } from "@/components/molecules/checkin-cta-button";
import { navigate } from "@/lib/navigation";
import { useTabScrollToTop } from "@/hooks/use-tab-scroll-to-top";
import { useScreenFocused } from "@/hooks/use-screen-focused";
import { PostScreenView } from "@/components/post/post-screen-view";
import { styles } from "@/components/post/post-screen-styles";

// docs/auth-home-oom-diagnosis-v2.md: 認証済みホームのOOMが e0cbccf(居場所リアルタイム公開)
// 導入以前は起きていなかったとの実機報告を受け、原因切り分けのため居場所マーカーの
// 描画とpresence.list定期クエリを一時停止する。マイページの設定・API・DBは変更しない
// （UI表示のみのオフ）。原因が確定し次第、安全な形で作り直して再有効化する。
const LIVE_PRESENCE_RADAR_ENABLED = false;

/**
 * 認証済みホーム OOM の bisect 用キルスイッチ（恒久的に残す）。
 * docs/auth-home-oom-diagnosis-v2.md Phase 0-1: `?romiLiteHome=1` または
 * localStorage で立てると、地図/マーカーの重い描画を丸ごとスキップし、
 * ステータスライン・封筒レール・シグナル一覧だけの軽量表示にする。
 * これで OOM の原因がレーダーステージ配下かどうかを実機1回で二分できる。
 */
function isLiteHomeRequested() {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  try {
    return (
      new URLSearchParams(window.location.search).has("romiLiteHome") ||
      window.localStorage.getItem("romiLiteHome") === "1"
    );
  } catch {
    return false;
  }
}

export function PostAuthenticatedScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReadyForUI } = useAuth();
  const toast = useToast();
  const tabInset = useTabBarInset();
  const scrollRef = useTabScrollToTop();
  // タブ切替（expo-router Tabsはアンマウントしない）/ブラウザタブ非アクティブ時に
  // レーダーの無限アニメを止める（docs/auth-home-oom-diagnosis-v2.md 施策K）。
  const focused = useScreenFocused();
  const { height: windowHeight } = useWindowDimensions();
  const mapMobileHeight = Math.min(Math.max(windowHeight * 0.36, 240), 320);
  const postContext = useScreenContextBar("post");

  const [openItem, setOpenItem] = useState<EncounterItem | null>(null);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [reportItem, setReportItem] = useState<EncounterItem | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [liteMode] = useState(isLiteHomeRequested);
  const [radarStageReady, setRadarStageReady] = useState(false);

  // 初期ピークを分散するため、レーダーステージ（地図+マーカー）のマウントを
  // 他の操作が落ち着くまで1tick遅らせる（docs/auth-home-oom-diagnosis-v2.md Phase 0-2）。
  useEffect(() => {
    if (liteMode) return;
    const task = InteractionManager.runAfterInteractions(() => {
      setRadarStageReady(true);
    });
    return () => task.cancel();
  }, [liteMode]);

  const { data: encounters, refetch, isFetching, isLoading: isLoadingEncounters } = trpc.encounter.list.useQuery(
    { cursor: undefined },
    { enabled: isAuthenticated, refetchInterval: false },
  );

  const { data: livePresence } = trpc.presence.list.useQuery(undefined, {
    enabled: isAuthenticated && LIVE_PRESENCE_RADAR_ENABLED,
    // docs/auth-home-oom-diagnosis-v2.md 施策G: モバイルは90秒に延ばしrefetch頻度を下げる。
    refetchInterval: Math.max(LIVE_PRESENCE_PULSE_INTERVAL_MS, isDesktop ? 60_000 : 90_000),
    gcTime: 5 * 60_000,
  });

  const { data: trailPeek } = trpc.zukan.myTrail.useQuery(
    { limit: 1 },
    { enabled: isAuthenticated, staleTime: 60_000, gcTime: 10 * 60_000 },
  );

  const { data: mySignal } = useMySignal();

  const { data: settingsData } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
  const isPausing =
    !!settingsData?.locationPausedUntil &&
    new Date(settingsData.locationPausedUntil) > new Date();
  const pausedUntilLabel = isPausing
    ? new Date(settingsData!.locationPausedUntil!).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const openMutation = trpc.encounter.open.useMutation();
  const reactMutation = trpc.encounter.react.useMutation();
  const blockMutation = trpc.safety.block.useMutation({
    onSuccess: () => refetch(),
  });
  const reportMutation = trpc.safety.report.useMutation();

  const handleOpen = useCallback(
    (item: EncounterItem) => {
      setOpenItem(item);
      setOpenModalVisible(true);
      if (!item.openedByMe) {
        openMutation.mutate({ encounterId: item.id });
      }
    },
    [openMutation],
  );

  const handleSendStamp = useCallback(
    (encounterId: number, emoji: string) => {
      reactMutation.mutate(
        { encounterId, emoji },
        {
          onSuccess: () => toast.showSuccess(`${emoji} を送りました`),
          onError: () => toast.showError("スタンプの送信に失敗しました"),
        },
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [reactMutation, toast],
  );

  const handleBlock = useCallback(
    (userId: number) => {
      blockMutation.mutate({ userId });
    },
    [blockMutation],
  );

  const handleReport = useCallback((item: EncounterItem) => {
    setReportItem(item);
    setReportModalVisible(true);
  }, []);

  const handleReportSubmit = useCallback(
    (targetUserId: number, encounterId: number, reason: string) => {
      reportMutation.mutate({
        targetUserId,
        encounterId,
        reason: reason as "inappropriate_hitokoto" | "spam" | "harassment" | "other",
      });
    },
    [reportMutation],
  );

  // 未開封 / 開封済みに分類
  const unopened = (encounters ?? []).filter((e) => !e.openedByMe);

  const checkedInRecently = useMemo(() => {
    const latest = trailPeek?.locations[0]?.recordedAt;
    if (!latest) return false;
    return Date.now() - new Date(latest).getTime() < 24 * 60 * 60 * 1000;
  }, [trailPeek?.locations]);

  const showCheckinCta = isAuthenticated && unopened.length === 0 && !checkedInRecently;

  // モバイル実機の OOM 対策: 地図に撒くマーカー数と、同時に動く無限アニメの
  // 本数を上限で絞る。あふれた分は「他N件」の集約チップで示し、全件は下部の
  // シグナル一覧から開封できるため情報自体は失われない（docs/auth-home-lightweight-PLAN.md §5）。
  const MAX_ENVELOPE_MARKERS = isDesktop ? 10 : 4;
  const ANIMATE_ENVELOPE_N = isDesktop ? 4 : 2;
  const MAX_PRESENCE_MARKERS = isDesktop ? 12 : 5;
  const ANIMATE_PRESENCE_N = 3;

  const envelopeMarkers = unopened.slice(0, MAX_ENVELOPE_MARKERS);
  const hiddenEnvelopeCount = unopened.length - envelopeMarkers.length;

  // isSelf を必ず含めた上で上限を適用（自分は常に地図に出す）。
  const presenceAll = LIVE_PRESENCE_RADAR_ENABLED ? (livePresence ?? []) : [];
  const presenceSelf = presenceAll.filter((m) => m.isSelf);
  const presenceOthers = presenceAll.filter((m) => !m.isSelf);
  const presenceMarkers = [...presenceSelf, ...presenceOthers].slice(0, MAX_PRESENCE_MARKERS);
  const hiddenPresenceCount = presenceAll.length - presenceMarkers.length;

  const signalGrid = isAuthenticated ? (
    <LazySignalAccountGrid
      items={(encounters ?? []) as SignalAccountItem[]}
      isDesktop={isDesktop}
      isFetching={isFetching}
      onPressItem={(item) => handleOpen(item as EncounterItem)}
      layout="docked"
      style={styles.signalPanelDocked}
    />
  ) : null;

  const emptyOverlay = isAuthenticated && !isLoadingEncounters && unopened.length === 0 && (
    <View style={[styles.emptyOverlay, !isDesktop && styles.emptyOverlayMobile]}>
      <Text style={styles.emptyOverlayEmoji}>📭</Text>
      <Text style={styles.emptyOverlayTitle}>まだ封筒は届いていません</Text>
      <Text style={styles.emptyOverlayText}>
        {checkedInRecently
          ? "今日は記録済みです。\nまた移動したらチェックインを"
          : "まず現在地を記録すると\n足あとが残り、すれ違いの判定が始まります"}
      </Text>
      {showCheckinCta ? (
        <CheckinCtaButton compact style={{ marginTop: 14 }} />
      ) : (
        <Pressable
          onPress={() => navigate.toCheckinTab()}
          style={({ pressed }) => [styles.checkinLink, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.checkinLinkText}>チェックイン画面へ</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <PostScreenView
      isDesktop={isDesktop}
      isAuthenticated={isAuthenticated}
      postContext={postContext}
      scrollRef={scrollRef}
      tabInset={tabInset}
      mapMobileHeight={mapMobileHeight}
      liteMode={liteMode}
      radarStageReady={radarStageReady}
      focused={focused}
      envelopeMarkers={envelopeMarkers}
      presenceMarkers={presenceMarkers}
      hiddenEnvelopeCount={hiddenEnvelopeCount}
      hiddenPresenceCount={hiddenPresenceCount}
      handleOpen={handleOpen}
      animateEnvelopeN={ANIMATE_ENVELOPE_N}
      animatePresenceN={ANIMATE_PRESENCE_N}
      mySignal={mySignal}
      isPausing={isPausing}
      pausedUntilLabel={pausedUntilLabel}
      unopened={unopened}
      emptyOverlay={emptyOverlay}
      signalGrid={signalGrid}
      showCheckinCta={showCheckinCta}
      openModalVisible={openModalVisible}
      openItem={openItem}
      setOpenModalVisible={setOpenModalVisible}
      refetch={refetch}
      handleSendStamp={handleSendStamp}
      handleBlock={handleBlock}
      handleReport={handleReport}
      reportItem={reportItem}
      reportModalVisible={reportModalVisible}
      setReportModalVisible={setReportModalVisible}
      handleReportSubmit={handleReportSubmit}
    />
  );
}
