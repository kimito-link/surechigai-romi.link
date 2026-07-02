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
} from "react-native";
import { useState, useCallback, lazy, Suspense, useMemo } from "react";
import { useRouter } from "expo-router";
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
  TIER_COLORS,
  TIER_LABELS,
  STAMPS,
  reasonLabel,
  formatEncounterDate,
} from "@/lib/post/encounter-shared";
import { EnvelopeCard } from "@/components/post/envelope-card";
import type { SignalAccountItem } from "@/components/organisms/signal-account-grid";
import {
  LazySignalAccountGrid,
  LazyEnvelopePulse,
  LazyCharacterHere,
  LazyEncounterOpenModal,
} from "@/lib/lazy-heavy-components";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import appConfig from "@/app.config.json";
import { latLngToRadarPercent } from "@/lib/japan-radar-position";
import { LIVE_PRESENCE_PULSE_INTERVAL_MS } from "@/modules/encounter/core/live-presence";
import { CheckinCtaButton } from "@/components/molecules/checkin-cta-button";
import { useTabScrollToTop } from "@/hooks/use-tab-scroll-to-top";

const JapanRadarMap = lazy(() =>
  import("@/components/organisms/japan-radar-map").then((m) => ({ default: m.JapanRadarMap })),
);
const RadarHud = lazy(() =>
  import("@/components/organisms/radar-hud").then((m) => ({ default: m.RadarHud })),
);

function DeferredRadarFallback() {
  return (
    <View style={{ minHeight: 120, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={color.accentPrimary} />
    </View>
  );
}

/** 履歴カード（開封済み） */
function HistoryCard({
  item,
  onSendStamp,
  onBlock,
  onReport,
}: {
  item: EncounterItem;
  onSendStamp: (encounterId: number, emoji: string) => void;
  onBlock: (userId: number) => void;
  onReport: (item: EncounterItem) => void;
}) {
  const tierColor = TIER_COLORS[item.tier] || color.accentPrimary;

  const openXProfile = () => {
    if (item.partnerName) {
      Linking.openURL(`https://x.com/${item.partnerName}`);
    }
  };

  return (
    <View style={styles.historyCard}>
      {/* 相手のアイコン（プレースホルダ） */}
      <View style={[styles.historyAvatar, { borderColor: tierColor + "66" }]}>
        <MaterialIcons name="account-circle" size={36} color={color.textMuted} />
      </View>

      <View style={styles.historyContent}>
        {/* 名前 + ティア */}
        <View style={styles.historyRow}>
          <Text style={styles.historyName} numberOfLines={1}>
            {item.partnerName || "ロミユーザー"}
          </Text>
          <View style={[styles.tierBadgeSmall, { backgroundColor: tierColor + "22" }]}>
            <Text style={[styles.tierTextSmall, { color: tierColor }]}>
              {TIER_LABELS[item.tier] || `T${item.tier}`}
            </Text>
          </View>
        </View>

        {/* エリア + 日時 */}
        <Text style={styles.historyArea} numberOfLines={1}>
          {item.areaName || item.prefecture || "不明なエリア"} ・ {formatEncounterDate(item.occurredAt)}
        </Text>

        {/* ひとこと */}
        {item.partnerHitokoto && (
          <Text style={styles.historyHitokoto} numberOfLines={2}>
            {item.partnerHitokoto}
          </Text>
        )}

        {/* 累計すれ違い数 */}
        <Text style={styles.historyTotal}>
          累計 {item.partnerTotalEncounters} 件のすれ違い
        </Text>

        {/* アクションボタン */}
        <View style={styles.historyActions}>
          {/* スタンプボタン */}
          {STAMPS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => onSendStamp(item.id, emoji)}
              style={({ pressed }) => [
                styles.stampButton,
                pressed && { opacity: 0.6, transform: [{ scale: 0.9 }] },
              ]}
            >
              <Text style={styles.stampText}>{emoji}</Text>
            </Pressable>
          ))}

          {/* Xプロフィールへ */}
          {item.partnerName && (
            <Pressable
              onPress={openXProfile}
              style={({ pressed }) => [
                styles.xButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.xButtonText}>X</Text>
            </Pressable>
          )}

          {/* ブロック/通報 */}
          <Pressable
            onPress={() => onReport(item)}
            style={({ pressed }) => [
              styles.reportButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialIcons name="more-horiz" size={18} color={color.textMuted} />
          </Pressable>
        </View>
      </View>
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
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const mapMobileHeight = Math.min(Math.max(windowHeight * 0.36, 240), 320);
  const postContext = useScreenContextBar("post");

  const [openItem, setOpenItem] = useState<EncounterItem | null>(null);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [reportItem, setReportItem] = useState<EncounterItem | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const { data: encounters, refetch, isFetching, isLoading: isLoadingEncounters } = trpc.encounter.list.useQuery(
    { cursor: undefined },
    { enabled: isAuthenticated, refetchInterval: false },
  );

  const { data: livePresence } = trpc.presence.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: Math.max(LIVE_PRESENCE_PULSE_INTERVAL_MS, 30_000),
  });

  const { data: trailPeek } = trpc.zukan.myTrail.useQuery(
    { limit: 1 },
    { enabled: isAuthenticated, staleTime: 60_000 },
  );

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
  const opened = (encounters ?? []).filter((e) => !!e.openedByMe);

  const checkedInRecently = useMemo(() => {
    const latest = trailPeek?.locations[0]?.recordedAt;
    if (!latest) return false;
    return Date.now() - new Date(latest).getTime() < 24 * 60 * 60 * 1000;
  }, [trailPeek?.locations]);

  const showCheckinCta = isAuthenticated && unopened.length === 0 && !checkedInRecently;

  const renderItem = useCallback(
    ({ item }: { item: EncounterItem }) => {
      if (!item.openedByMe) {
        return (
          <EnvelopeCard item={item} onOpen={handleOpen} />
        );
      }
      return (
        <HistoryCard
          item={item}
          onSendStamp={handleSendStamp}
          onBlock={handleBlock}
          onReport={handleReport}
        />
      );
    },
    [handleOpen, handleSendStamp, handleBlock, handleReport],
  );

  const renderRadarStage = () => (
    <Suspense fallback={<DeferredRadarFallback />}>
      <JapanRadarMap>
        {unopened.map((item) => {
          const randomX = 10 + (Math.sin(item.id * 123) * 0.5 + 0.5) * 80;
          const randomY = 10 + (Math.cos(item.id * 321) * 0.5 + 0.5) * 80;
          return (
            <LazyEnvelopePulse
              key={item.id}
              x={randomX}
              y={randomY}
              onPress={() => handleOpen(item)}
            />
          );
        })}
        {(livePresence ?? []).map((marker, index) => {
          const pos = latLngToRadarPercent(marker.lat, marker.lng);
          if (!pos) return null;
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
            />
          );
        })}
      </JapanRadarMap>
    </Suspense>
  );

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
          onPress={() => router.push("/(tabs)/checkin")}
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
          {renderRadarStage()}
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
          <View style={[styles.mapHeroMobile, { height: mapMobileHeight }]}>
            {renderRadarStage()}
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
  // History card
  historyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: color.surfaceEmphasis,
    borderWidth: 1,
    borderColor: color.border,
  },
  historyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  historyName: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  tierBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierTextSmall: {
    fontSize: 10,
    fontWeight: "700",
  },
  historyArea: {
    color: color.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  historyHitokoto: {
    color: color.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 4,
  },
  historyTotal: {
    color: color.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  historyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stampButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stampText: {
    fontSize: 18,
  },
  xButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: color.twitter + "22",
    borderWidth: 1,
    borderColor: color.twitter + "55",
  },
  xButtonText: {
    color: color.twitter,
    fontSize: 12,
    fontWeight: "700",
  },
  reportButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surfaceAlt,
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
