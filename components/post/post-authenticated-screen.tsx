/**
 * ポスト画面（封筒一覧）
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * - 未開封の封筒を積み重ね演出（強調表示）
 * - タップで開封アニメーション → 相手カード表示
 * - 開封済みは履歴リスト
 * - pull-to-refresh
 * - 未ログイン時: X ログイン誘導
 */

import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Linking,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from "react";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/atoms/toast";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { TabHeaderSpacer } from "@/components/organisms/tab-header-spacer";
import { useScreenContextBar } from "@/hooks/use-screen-context-bar";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import {
  type EncounterItem,
  reasonLabel,
} from "@/lib/post/encounter-shared";
import { HomeStatusLine } from "@/components/post/home-status-line";
import { EnvelopeRail } from "@/components/post/envelope-rail";
import { RadarStageBoundary } from "@/components/post/radar-stage-boundary";
import type { SignalAccountItem } from "@/components/organisms/signal-account-grid";
import {
  LazySignalAccountGrid,
  LazyEnvelopePulse,
  LazyCharacterHere,
  LazyEncounterOpenModal,
} from "@/lib/lazy-heavy-components";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useMySignal } from "@/hooks/use-my-signal";
import appConfig from "@/app.config.json";
import { latLngToRadarPercent } from "@/lib/japan-radar-position";
import { LIVE_PRESENCE_PULSE_INTERVAL_MS } from "@/modules/encounter/core/live-presence";
import { CheckinCtaButton } from "@/components/molecules/checkin-cta-button";
import { useTabScrollToTop } from "@/hooks/use-tab-scroll-to-top";
import { useScreenFocused } from "@/hooks/use-screen-focused";

// docs/auth-home-oom-diagnosis-v2.md: 認証済みホームのOOMが e0cbccf(居場所リアルタイム公開)
// 導入以前は起きていなかったとの実機報告を受け、原因切り分けのため居場所マーカーの
// 描画とpresence.list定期クエリを一時停止する。マイページの設定・API・DBは変更しない
// （UI表示のみのオフ）。原因が確定し次第、安全な形で作り直して再有効化する。
const LIVE_PRESENCE_RADAR_ENABLED = false;

const JapanRadarMap = lazy(() =>
  import("@/components/organisms/japan-radar-map").then((m) => ({ default: m.JapanRadarMap })),
);
const RadarHud = lazy(() =>
  import("@/components/organisms/radar-hud").then((m) => ({ default: m.RadarHud })),
);

function DeferredRadarFallback({ style }: { style?: object }) {
  return (
    <View style={[{ minHeight: 120, alignItems: "center", justifyContent: "center" }, style]}>
      <ActivityIndicator color={color.accentPrimary} />
    </View>
  );
}

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

function LiteRadarPlaceholder({ style }: { style?: object }) {
  return (
    <View style={[{ backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={{ color: color.textMuted, fontSize: 12 }}>軽量表示中（地図オフ）</Text>
    </View>
  );
}

/** 通報モーダル */
function ReportModal({
  item,
  visible,
  onClose,
  onBlock,
  onReport,
}: {
  item: EncounterItem | null;
  visible: boolean;
  onClose: () => void;
  onBlock: (userId: number) => void;
  onReport: (targetUserId: number, encounterId: number, reason: string) => void;
}) {
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.reportCard}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.reportTitle}>対応を選んでください</Text>

            <Pressable
              onPress={() => { onBlock(item.partnerId); onClose(); }}
              style={({ pressed }) => [styles.reportItem, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="block" size={20} color={color.danger} style={{ marginRight: 12 }} />
              <Text style={[styles.reportItemText, { color: color.danger }]}>ブロックする</Text>
            </Pressable>

            {["inappropriate_hitokoto", "spam", "harassment", "other"].map((reason) => (
              <Pressable
                key={reason}
                onPress={() => { onReport(item.partnerId, item.id, reason); onClose(); }}
                style={({ pressed }) => [styles.reportItem, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="flag" size={20} color={color.textMuted} style={{ marginRight: 12 }} />
                <Text style={styles.reportItemText}>{reasonLabel(reason)}</Text>
              </Pressable>
            ))}

            <Pressable onPress={onClose} style={({ pressed }) => [styles.reportCancelButton, pressed && { opacity: 0.7 }]}>
              <Text style={styles.reportCancelText}>キャンセル</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
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

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

  const renderRadarStage = (stageStyle?: object) => {
    if (liteMode) return <LiteRadarPlaceholder style={stageStyle} />;
    if (!radarStageReady) return <DeferredRadarFallback style={stageStyle} />;

    return (
      <RadarStageBoundary style={stageStyle}>
        <Suspense fallback={<DeferredRadarFallback style={stageStyle} />}>
          <JapanRadarMap active={focused}>
            {envelopeMarkers.map((item, index) => {
              const randomX = 10 + (Math.sin(item.id * 123) * 0.5 + 0.5) * 80;
              const randomY = 10 + (Math.cos(item.id * 321) * 0.5 + 0.5) * 80;
              return (
                <LazyEnvelopePulse
                  key={item.id}
                  x={randomX}
                  y={randomY}
                  onPress={() => handleOpen(item)}
                  animate={focused && index < ANIMATE_ENVELOPE_N}
                />
              );
            })}
            {presenceMarkers.map((marker, index) => {
              const pos = latLngToRadarPercent(marker.lat, marker.lng);
              if (!pos) return null;
              // モバイルは自分＋最新数人だけパルスを動かし、残りは静止。
              const shouldAnimate = focused && (marker.isSelf || index < ANIMATE_PRESENCE_N);
              return (
                <LazyCharacterHere
                  key={`live-${marker.userId}`}
                  imageUrl={marker.profileImage}
                  name={marker.name ?? "ユーザー"}
                  place={marker.place ?? undefined}
                  x={pos.x}
                  y={pos.y}
                  delay={index * 120}
                  isSelf={marker.isSelf}
                  animate={shouldAnimate}
                />
              );
            })}
            {(hiddenEnvelopeCount > 0 || hiddenPresenceCount > 0) ? (
              <View style={styles.radarOverflowChip} pointerEvents="none">
                {hiddenEnvelopeCount > 0 ? (
                  <Text style={styles.radarOverflowText}>＋他{hiddenEnvelopeCount}通のシグナル</Text>
                ) : null}
                {hiddenPresenceCount > 0 ? (
                  <Text style={styles.radarOverflowText}>＋他{hiddenPresenceCount}人がどこかにいる</Text>
                ) : null}
              </View>
            ) : null}
          </JapanRadarMap>
        </Suspense>
      </RadarStageBoundary>
    );
  };

  const renderSisterBanners = (inFlow = false) =>
    (appConfig.siblingServices ?? []).map((svc) => (
      <Pressable
        key={svc.url}
        onPress={() => Linking.openURL(svc.url)}
        style={({ pressed }) => [
          inFlow ? styles.sisterBannerFlow : styles.sisterBanner,
          pressed && { opacity: 0.75 },
        ]}
      >
        <MaterialIcons name="hub" size={16} color={color.accentPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sisterBannerLabel}>SISTER_SERVICE</Text>
          <Text style={styles.sisterBannerName} numberOfLines={1}>{svc.name}</Text>
        </View>
        <MaterialIcons name="open-in-new" size={14} color={color.textMuted} />
      </Pressable>
    ));

  const signalGrid = isAuthenticated ? (
    <LazySignalAccountGrid
      items={(encounters ?? []) as SignalAccountItem[]}
      isDesktop={isDesktop}
      isFetching={isFetching}
      onPressItem={(item) => handleOpen(item as EncounterItem)}
      layout={isDesktop ? "overlay" : "docked"}
      style={
        isDesktop
          ? [styles.signalPanel, styles.signalPanelDesktop]
          : styles.signalPanelDocked
      }
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
      <ScreenContainer style={{ backgroundColor: color.bg }} edges={[]}>
        <AppHeader variant="full" contextBar={postContext.element} />
        <TabHeaderSpacer variant="full" hasContextBar={postContext.hasBar} />

        {isDesktop ? (
        <View style={styles.mapContainer}>
          {renderRadarStage(StyleSheet.absoluteFillObject)}
          {signalGrid}
          {emptyOverlay}
          {renderSisterBanners()}
          {!isAuthenticated && (
            <Suspense fallback={null}>
              <RadarHud isAuthenticated={false} />
            </Suspense>
          )}
        </View>
        ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.mobileScroll}
          contentContainerStyle={[styles.mobileScrollContent, { paddingBottom: tabInset }]}
          showsVerticalScrollIndicator={false}
        >
          {isAuthenticated && mySignal ? (
            <HomeStatusLine
              checkedInToday={mySignal.checkedInToday}
              latestPlaceLabel={mySignal.latestPlaceLabel}
              latestRecordedAt={mySignal.latestRecordedAt}
              accuracyM={mySignal.latestLocation?.accuracyM}
              isPausing={isPausing}
              pausedUntilLabel={pausedUntilLabel}
            />
          ) : null}
          {isAuthenticated && unopened.length > 0 ? (
            <EnvelopeRail items={unopened} onOpen={handleOpen} />
          ) : null}
          <View style={[styles.mapHeroMobile, { height: mapMobileHeight }]}>
            {renderRadarStage({ flex: 1 })}
            {emptyOverlay}
            {!isAuthenticated && (
            <Suspense fallback={null}>
              <RadarHud isAuthenticated={false} />
            </Suspense>
          )}
          </View>
          {signalGrid}
          {showCheckinCta && !isDesktop ? (
            <View style={styles.checkinCtaDock}>
              <CheckinCtaButton label="足あとを残す — チェックイン" />
            </View>
          ) : null}
          <View style={styles.mobileFooter}>{renderSisterBanners(true)}</View>
        </ScrollView>
        )}

      {/* 開封モーダル（reanimated chunk — 開封時のみ load） */}
      {openModalVisible && openItem ? (
        <LazyEncounterOpenModal
          item={openItem}
          visible={openModalVisible}
          onClose={() => {
            setOpenModalVisible(false);
            refetch();
          }}
          onSendStamp={handleSendStamp}
          onBlock={handleBlock}
          onReport={handleReport}
        />
      ) : null}

      {/* 通報モーダル */}
      <ReportModal
        item={reportItem}
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onBlock={handleBlock}
        onReport={handleReportSubmit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // 地図マーカーの上限を超えた分を示す集約チップ（sisterBanner と衝突しない上寄せ）。
  radarOverflowChip: {
    position: "absolute",
    top: 12,
    right: 12,
    maxWidth: "70%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(13,17,23,0.72)",
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "55",
    gap: 2,
    zIndex: 20,
  },
  radarOverflowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: color.bg,
  },
  signalPanel: {
    position: "absolute",
    zIndex: 30,
  },
  signalPanelDesktop: {
    top: 18,
    left: 24,
    right: 24,
    maxHeight: 360,
  },
  signalPanelDocked: {
    marginTop: 12,
    marginHorizontal: 10,
  },
  mobileScroll: {
    flex: 1,
    backgroundColor: color.bg,
  },
  mobileScrollContent: {
    flexGrow: 1,
  },
  mapHeroMobile: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.bg,
  },
  mobileFooter: {
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  sisterBannerFlow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "33",
  },
  emptyOverlayMobile: {
    top: "38%",
  },
  emptyOverlay: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 6,
  },
  emptyOverlayEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyOverlayTitle: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyOverlayText: {
    color: color.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  checkinLink: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  checkinLinkText: {
    color: color.accentPrimary,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  checkinCtaDock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  dividerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "CC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  // Report modal
  reportCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 20,
  },
  reportTitle: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  reportItemText: {
    color: color.textPrimary,
    fontSize: 14,
  },
  reportCancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  reportCancelText: {
    color: color.textMuted,
    fontSize: 14,
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
  loginGateSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
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
  // Empty state
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  checkinButton: {
    backgroundColor: color.accentIndigo,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  checkinButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  // 姉妹サービス導線（地図下部に固定・サイバー風）
  sisterBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "33",
  },
  sisterBannerLabel: {
    color: color.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  sisterBannerName: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
});
