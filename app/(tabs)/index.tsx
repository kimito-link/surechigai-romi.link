/**
 * ポスト画面（封筒一覧）
 * すれちがいロミ MVP
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
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { RadarHud } from "@/components/organisms/radar-hud";
import { AppHeader } from "@/components/organisms/app-header";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import { JapanRadarMap } from "@/components/organisms/japan-radar-map";
import { EnvelopePulse } from "@/components/molecules/envelope-pulse";
import { NightSkyBackdrop } from "@/components/organisms/night-sky-backdrop";
import { CharacterHere } from "@/components/molecules/character-here";
import { SignalAccountGrid, type SignalAccountItem } from "@/components/organisms/signal-account-grid";
import appConfig from "@/app.config.json";

// ティアラベル
const TIER_LABELS: Record<number, string> = {
  1: "すれすれ",
  2: "ちかい",
  3: "出会い",
  4: "同担",
  5: "運命",
};

const TIER_COLORS: Record<number, string> = {
  1: palette.gray400,
  2: color.teal500,
  3: color.accentPrimary,
  4: color.accentAlt,
  5: "#F59E0B",
};

// スタンプ定義
const STAMPS = ["👋", "🎉", "💫", "🌟"];

type EncounterItem = {
  id: number;
  partnerId: number;
  partnerName: string | null;
  partnerHitokoto: string | null;
  tier: number;
  areaName: string | null;
  prefecture: string | null;
  occurredAt: Date;
  openedByMe: Date | null;
  partnerTotalEncounters: number;
  partnerUsername?: string | null;
  partnerDisplayName?: string | null;
  partnerProfileImage?: string | null;
  partnerFollowersCount?: number | null;
};

/** 封筒カード（未開封） */
function EnvelopeCard({
  item,
  onOpen,
}: {
  item: EncounterItem;
  onOpen: (item: EncounterItem) => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withSpring(0.96, { duration: 100 }),
      withSpring(1.03, { duration: 120 }),
      withSpring(1, { duration: 100 }),
    );
    // 少し待ってから開封
    setTimeout(() => runOnJS(onOpen)(item), 200);
  };

  const tierColor = TIER_COLORS[item.tier] || color.accentPrimary;

  return (
    <Animated.View style={[styles.envelopeCard, animStyle]}>
      <Pressable onPress={handlePress} style={styles.envelopePressable}>
        {/* 封筒アイコン */}
        <View style={[styles.envelopeIconWrap, { borderColor: tierColor + "66" }]}>
          <MaterialIcons name="mail" size={36} color={tierColor} />
          <View style={[styles.envelopeSealDot, { backgroundColor: tierColor }]} />
        </View>

        {/* テキスト */}
        <View style={styles.envelopeTextWrap}>
          <View style={styles.envelopeRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "22" }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>
                {TIER_LABELS[item.tier] || `Tier ${item.tier}`}
              </Text>
            </View>
            <Text style={styles.envelopeDate}>
              {formatDate(item.occurredAt)}
            </Text>
          </View>
          <Text style={styles.envelopeArea} numberOfLines={1}>
            {item.areaName || item.prefecture || "不明なエリア"}
          </Text>
          <Text style={styles.envelopeTapHint}>タップして開封</Text>
        </View>

        {/* 未開封バッジ */}
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </Pressable>
    </Animated.View>
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
          {item.areaName || item.prefecture || "不明なエリア"} ・ {formatDate(item.occurredAt)}
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

/** 開封モーダル（相手カード） */
function OpenModal({
  item,
  visible,
  onClose,
  onSendStamp,
  onBlock,
  onReport,
}: {
  item: EncounterItem | null;
  visible: boolean;
  onClose: () => void;
  onSendStamp: (encounterId: number, emoji: string) => void;
  onBlock: (userId: number) => void;
  onReport: (item: EncounterItem) => void;
}) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible && item) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Gacha flash animation
      opacity.value = 1;
      rotation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    } else {
      scale.value = 0.1;
      opacity.value = 0;
    }
  }, [visible, item]);

  if (!item) return null;

  const tierColor = TIER_COLORS[item.tier] || color.accentPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalCard, animStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* ティアバナー */}
            <View style={[styles.modalTierBanner, { backgroundColor: tierColor + "33", borderColor: tierColor, borderWidth: 1 }]}>
              <Text style={[styles.modalTierText, { color: tierColor, textShadowColor: tierColor, textShadowOffset: {width:0, height:0}, textShadowRadius: 8 }]}>
                {TIER_LABELS[item.tier] || `Tier ${item.tier}`} シグナルデコード成功
              </Text>
            </View>

            {/* 相手アバター */}
            <View style={styles.modalAvatarWrap}>
              <View style={[styles.modalAvatar, { borderColor: tierColor }]}>
                <MaterialIcons name="account-circle" size={64} color={color.textMuted} />
              </View>
            </View>

            {/* 相手情報 */}
            <Text style={styles.modalName}>
              {item.partnerName || "ロミユーザー"}
            </Text>

            <Text style={styles.modalArea}>
              {item.areaName || item.prefecture || "不明なエリア"}
            </Text>

            {/* ひとこと */}
            {item.partnerHitokoto && (
              <View style={styles.modalHitokotoWrap}>
                <Text style={styles.modalHitokoto}>{item.partnerHitokoto}</Text>
              </View>
            )}

            {/* 累計 */}
            <Text style={styles.modalTotal}>
              {item.partnerName || "この人"}は累計 {item.partnerTotalEncounters} 件のすれ違い
            </Text>

            {/* スタンプ */}
            <View style={styles.modalStamps}>
              {STAMPS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    onSendStamp(item.id, emoji);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.modalStampButton,
                    pressed && { opacity: 0.6, transform: [{ scale: 0.85 }] },
                  ]}
                >
                  <Text style={styles.modalStampEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Xプロフィールへ */}
            {item.partnerName && (
              <Pressable
                onPress={() => Linking.openURL(`https://x.com/${item.partnerName}`)}
                style={({ pressed }) => [
                  styles.modalXButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.modalXButtonText}>X プロフィールを見る @{item.partnerName}</Text>
              </Pressable>
            )}

            {/* 通報/ブロック */}
            <View style={styles.modalSafetyRow}>
              <Pressable
                onPress={() => { onBlock(item.partnerId); onClose(); }}
                style={({ pressed }) => [styles.safetyButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.safetyButtonText}>ブロック</Text>
              </Pressable>
              <Pressable
                onPress={() => { onReport(item); onClose(); }}
                style={({ pressed }) => [styles.safetyButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.safetyButtonText}>通報</Text>
              </Pressable>
            </View>

            {/* 閉じる */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalCloseButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.modalCloseText}>閉じる</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
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

function reasonLabel(reason: string): string {
  switch (reason) {
    case "inappropriate_hitokoto": return "不適切なひとことを通報";
    case "spam": return "スパムとして通報";
    case "harassment": return "嫌がらせとして通報";
    default: return "その他の理由で通報";
  }
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "たった今";
  if (h < 24) return `${h}時間前`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}日前`;
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export default function PostScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  const [openItem, setOpenItem] = useState<EncounterItem | null>(null);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [reportItem, setReportItem] = useState<EncounterItem | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const { data: encounters, refetch, isFetching } = trpc.encounter.list.useQuery(
    { cursor: undefined },
    { enabled: isAuthenticated, refetchInterval: false },
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
      reactMutation.mutate({ encounterId, emoji });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [reactMutation],
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

  return (
    <ScreenContainer style={{ backgroundColor: "#020817" }} edges={[]}>
      {/* ログイン後は共通ヘッダー(ログイン中表示＋メニュー＝ログアウト)。未ログインはヒーロー演出。 */}
      {isAuthenticated ? (
        <AppHeader />
      ) : (
        <RadarHud isAuthenticated={isAuthenticated} />
      )}

      {!isAuthReadyForUI ? null : (
        <View style={styles.mapContainer}>
          {/* 夜空（星・天の川・富士・流れ星）を地図の背面に敷く */}
          <NightSkyBackdrop />
          <JapanRadarMap>
            {unopened.map((item, index) => {
              // Pseudo-random position based on item id for MVP
              const randomX = 10 + (Math.sin(item.id * 123) * 0.5 + 0.5) * 80;
              const randomY = 10 + (Math.cos(item.id * 321) * 0.5 + 0.5) * 80;
              return (
                <EnvelopePulse
                  key={item.id}
                  x={randomX}
                  y={randomY}
                  onPress={() => handleOpen(item)}
                />
              );
            })}

            {/* キャラの現在地（吹き出し「○○にいるよ」）。中央の文字を避け、日本各地の縁に配置。 */}
            <CharacterHere source={require("@/assets/images/characters/rinku.png")} name="りんく" place="小樽" x={74} y={12} delay={0} />
            <CharacterHere source={require("@/assets/images/characters/konta.png")} name="こん太" place="博多" x={6} y={91} delay={400} />
            <CharacterHere source={require("@/assets/images/characters/tanune.png")} name="たぬ姉" place="松山" x={33} y={86} delay={800} />
          </JapanRadarMap>

          {isAuthenticated && (
            <SignalAccountGrid
              items={(encounters ?? []) as SignalAccountItem[]}
              isDesktop={isDesktop}
              isFetching={isFetching}
              onPressItem={(item) => handleOpen(item as EncounterItem)}
              style={[
                styles.signalPanel,
                isDesktop ? styles.signalPanelDesktop : styles.signalPanelMobile,
              ]}
            />
          )}
          
          {unopened.length === 0 && (
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyOverlayEmoji}>📭</Text>
              <Text style={styles.emptyOverlayTitle}>
                まだ封筒は届いていません
              </Text>
              <Text style={styles.emptyOverlayText}>
                チェックインすると{"\n"}近くにいたファンの封筒が届くかも
              </Text>
            </View>
          )}

          {/* 姉妹サービス導線：同じシグナルID(アカウント)で接続できる別サービスへ。地図下部に固定。 */}
          {(appConfig.siblingServices ?? []).map((svc) => (
            <Pressable
              key={svc.url}
              onPress={() => Linking.openURL(svc.url)}
              style={({ pressed }) => [styles.sisterBanner, pressed && { opacity: 0.75 }]}
            >
              <MaterialIcons name="hub" size={16} color={color.accentPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sisterBannerLabel}>SISTER_SERVICE</Text>
                <Text style={styles.sisterBannerName} numberOfLines={1}>{svc.name}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={14} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ))}
        </View>
      )}

      {/* 開封モーダル */}
      <OpenModal
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
    backgroundColor: "#020817", // Kimito-link universe dark
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
  signalPanelMobile: {
    top: 10,
    left: 10,
    right: 10,
    maxHeight: 292,
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: color.accentPrimary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  emptyOverlayText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
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
    color: color.textWhite,
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
  // Envelope card
  envelopeCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: color.surface,
    overflow: "hidden",
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  envelopePressable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  envelopeIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  envelopeSealDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  envelopeTextWrap: {
    flex: 1,
  },
  envelopeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "700",
  },
  envelopeDate: {
    color: color.textMuted,
    fontSize: 11,
  },
  envelopeArea: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  envelopeTapHint: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "500",
  },
  newBadge: {
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    color: color.textWhite,
    fontSize: 10,
    fontWeight: "800",
  },
  // History card
  historyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: color.surfaceDark,
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
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: color.surface,
    borderRadius: 24,
    overflow: "hidden",
    padding: 24,
  },
  modalTierBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  modalTierText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalAvatarWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalName: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  modalArea: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  modalHitokotoWrap: {
    backgroundColor: color.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  modalHitokoto: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalTotal: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },
  modalStamps: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalStampButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalStampEmoji: {
    fontSize: 26,
  },
  modalXButton: {
    backgroundColor: color.twitter + "22",
    borderWidth: 1,
    borderColor: color.twitter + "55",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  modalXButtonText: {
    color: color.twitter,
    fontSize: 14,
    fontWeight: "600",
  },
  modalSafetyRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  safetyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: color.surfaceAlt,
  },
  safetyButtonText: {
    color: color.textMuted,
    fontSize: 12,
  },
  modalCloseButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  modalCloseText: {
    color: color.textMuted,
    fontSize: 14,
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
    backgroundColor: "rgba(2,8,23,0.85)",
    borderWidth: 1,
    borderColor: color.accentPrimary + "55",
  },
  sisterBannerLabel: {
    color: color.accentPrimary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  sisterBannerName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
});
