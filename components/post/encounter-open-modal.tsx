/**
 * 封筒開封モーダル（reanimated 込み — 開封時のみ lazy load）。
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import {
  type EncounterItem,
  TIER_COLORS,
  TIER_LABELS,
  STAMPS,
  formatEncounterDate,
} from "@/lib/post/encounter-shared";
import { buildXFollowUrl } from "@/lib/x-follow";
import { color, palette } from "@/theme/tokens";
import { CreatorAvatar } from "@/components/molecules/creator-avatar";
import { CategoryChips } from "@/components/molecules/category-chips";
import { normalizeTwitterUsername } from "@/lib/twitter-username";
import {
  parseCategories,
  sharedCategories,
} from "@/modules/encounter/core/category";
import { trpc } from "@/lib/trpc";

function FloatingEmoji({ emoji, offsetX }: { emoji: string; offsetX: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -110 * progress.value },
      { scale: 1 + 0.5 * progress.value },
    ],
    opacity: 1 - progress.value,
  }));

  return (
    <Animated.Text
      pointerEvents="none"
      style={[styles.floatingEmoji, { marginLeft: offsetX }, animStyle]}
    >
      {emoji}
    </Animated.Text>
  );
}

export type EncounterOpenModalProps = {
  item: EncounterItem | null;
  visible: boolean;
  onClose: () => void;
  onSendStamp: (encounterId: number, emoji: string) => void;
  onBlock: (userId: number) => void;
  onReport: (item: EncounterItem) => void;
};

export function EncounterOpenModal({
  item,
  visible,
  onClose,
  onSendStamp,
  onBlock,
  onReport,
}: EncounterOpenModalProps) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const [floats, setFloats] = useState<{ id: number; emoji: string; offsetX: number }[]>([]);
  const [sentEmoji, setSentEmoji] = useState<string | null>(null);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible && item) {
      if (Platform.OS !== "web") {
        // レア度（Tier 4-5）に応じてすれ違ひデコードの触覚パターンを変化させる
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (item.tier >= 4) {
          setTimeout(() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 160);
        }
      }
      opacity.value = 1;
      rotation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 }),
      );
    } else {
      scale.value = 0.1;
      opacity.value = 0;
      setFloats([]);
      setSentEmoji(null);
    }
  }, [visible, item, opacity, rotation, scale]);

  const handleStampPress = (emoji: string, idx: number) => {
    if (!item) return;
    onSendStamp(item.id, emoji);
    setSentEmoji(emoji);
    const id = Date.now() + idx;
    const offsetX = (idx - (STAMPS.length - 1) / 2) * 64 - 15;
    setFloats((f) => [...f, { id, emoji, offsetX }]);
    setTimeout(() => setFloats((f) => f.filter((e) => e.id !== id)), 950);
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        void Haptics.selectionAsync();
      }, 140);
    }
  };

  if (!item) return null;

  const tierColor = TIER_COLORS[item.tier] || color.accentPrimary;
  // 表示名とハンドルを分けて持つ（表示名をハンドルとして使わないため・2026-08-07）
  const modalDisplayName =
    item.partnerDisplayName || item.partnerName || "ロミユーザー";
  const modalHandle = normalizeTwitterUsername(item.partnerUsername);

  /**
   * 相手の属性と、そのうち自分と一致したもの。
   * ★「何が一致したか」だけを見せる。相性スコアのような数字は作らない
   *   （根拠を説明できない数字は信用を損なう。core/category.ts の方針）。
   */
  const meQuery = trpc.auth.me.useQuery();
  const partnerCategories = parseCategories(item.partnerCategories);
  const matched = sharedCategories(
    partnerCategories,
    parseCategories(meQuery.data?.categories),
  );
  const followUrl = buildXFollowUrl(modalHandle);
  const dateLabel = formatEncounterDate(item.occurredAt);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalCard, animStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalTierBanner,
                {
                  backgroundColor: tierColor + "1F",
                  borderColor: tierColor,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTierText,
                  {
                    color: tierColor,
                  },
                ]}
              >
                {TIER_LABELS[item.tier] || `Tier ${item.tier}`} シグナルデコード成功
              </Text>
            </View>

            {/* アイコンは CreatorAvatar に委譲する（2026-08-07）。
                以前は MaterialIcons のプレースホルダーをハードコードしており、
                item.partnerProfileImage が届いているのに描画していなかった。
                twitterHandle を必ず渡すこと（渡さないと unavatar フォールバックが消える）。 */}
            <View style={styles.modalAvatarWrap}>
              <View style={[styles.modalAvatar, { borderColor: tierColor }]}>
                <CreatorAvatar
                  src={item.partnerProfileImage}
                  alt={modalDisplayName}
                  fallbackInitial={modalDisplayName.slice(0, 1)}
                  size={72}
                  twitterHandle={item.partnerUsername}
                  recyclingKey={String(item.partnerId ?? item.id)}
                />
              </View>
            </View>

            <Text style={styles.modalName} numberOfLines={2}>
              {modalDisplayName}
            </Text>

            {/* @ハンドル。取れないときは何も出さない（内部IDを他人に見せる意味はない） */}
            {modalHandle && (
              <Text style={styles.modalHandle} numberOfLines={1}>
                @{modalHandle}
              </Text>
            )}

            <View style={styles.modalLocationBadge}>
              <MaterialIcons name="place" size={15} color={palette.kimitoOrange} />
              <Text style={styles.modalArea} numberOfLines={1}>
                {item.areaName || item.prefecture || "不明なエリア"}
              </Text>
              {dateLabel ? (
                <Text style={styles.modalDateText}>· {dateLabel}</Text>
              ) : null}
            </View>

            {item.partnerHitokoto && (
              <View style={styles.modalHitokotoWrap}>
                <Text style={styles.modalHitokoto} numberOfLines={4}>
                  {item.partnerHitokoto}
                </Text>
              </View>
            )}

            {/* 属性。一致したものは枠つきで強調される（CategoryChips の highlight） */}
            {partnerCategories.length > 0 && (
              <View style={styles.modalCategoriesWrap}>
                <CategoryChips ids={partnerCategories} highlight={matched} />
                {matched.length > 0 && (
                  <Text style={styles.modalCategoryNote}>
                    あなたと同じ属性が {matched.length} つ
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.modalTotal}>
              {item.partnerName || "この人"}は累計 {item.partnerTotalEncounters} 件のすれ違い
            </Text>

            <View style={styles.modalStampsWrap}>
              <View style={styles.modalStamps}>
                {STAMPS.map((emoji, idx) => (
                  <Pressable
                    key={emoji}
                    onPress={() => handleStampPress(emoji, idx)}
                    style={({ pressed }) => [
                      styles.modalStampButton,
                      sentEmoji === emoji && styles.modalStampButtonActive,
                      pressed && { opacity: 0.6, transform: [{ scale: 0.85 }] },
                    ]}
                  >
                    <Text style={styles.modalStampEmoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <View pointerEvents="none" style={styles.floatLayer}>
                {floats.map((f) => (
                  <FloatingEmoji key={f.id} emoji={f.emoji} offsetX={f.offsetX} />
                ))}
              </View>
            </View>
            {sentEmoji && (
              <Text style={styles.stampConfirm}>{sentEmoji} を送りました ✨</Text>
            )}

            {/* ★表示名から URL を組んではいけない（2026-08-07）。
                users.name は表示名なので https://x.com/君斗りんく@動員ちゃれんじ のような
                必ず404になる URL ができていた。検証済みハンドルが無いときはリンクを出さない
                （壊れたリンクは無価値どころか有害）。 */}
            {modalHandle && (
              <Pressable
                onPress={() => Linking.openURL(`https://x.com/${modalHandle}`)}
                style={({ pressed }) => [styles.modalXButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.modalXButtonText} numberOfLines={1}>
                  X プロフィールを見る @{modalHandle}
                </Text>
              </Pressable>
            )}

            {/* このアプリはアプリ内DMを持たない（交流は X に委ねる設計）ので、
                繋がる手段はフォローだけ。プロフィールを開くだけだと相手に
                「本人か確かめる → フォローを探して押す」が残るため、
                フォロー確認画面へ直行する導線も並べる。
                ★自動フォローではない。最後は本人が押す（文言もそう書く）。 */}
            {followUrl && (
              <Pressable
                onPress={() => Linking.openURL(followUrl)}
                accessibilityRole="link"
                accessibilityLabel={`@${modalHandle} をXでフォローする`}
                style={({ pressed }) => [styles.modalFollowButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.modalFollowButtonText} numberOfLines={1}>
                  X でフォローする
                </Text>
              </Pressable>
            )}

            <View style={styles.modalSafetyRow}>
              <Pressable
                onPress={() => {
                  onBlock(item.partnerId);
                  onClose();
                }}
                style={({ pressed }) => [styles.safetyButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.safetyButtonText}>ブロック</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onReport(item);
                  onClose();
                }}
                style={({ pressed }) => [styles.safetyButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.safetyButtonText}>通報</Text>
              </Pressable>
            </View>

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

const styles = StyleSheet.create({
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    overflow: "hidden",
    padding: 20,
  },
  modalTierBanner: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  modalTierText: {
    fontSize: 13,
    fontWeight: "800",
  },
  modalAvatarWrap: {
    alignItems: "center",
    marginBottom: 10,
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
  /** @ハンドル。表示名の下に控えめに置く（主役は表示名・DESIGN.md の階層に従う） */
  modalHandle: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  modalLocationBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: palette.kimitoBlueSoft,
    marginBottom: 14,
  },
  modalArea: {
    color: palette.kimitoBlue,
    fontSize: 13,
    fontWeight: "700",
  },
  modalDateText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  modalHitokotoWrap: {
    backgroundColor: palette.kimitoBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    padding: 12,
    marginBottom: 12,
  },
  modalHitokoto: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  modalCategoriesWrap: {
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  modalCategoryNote: {
    color: color.accentIndigo,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modalTotal: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  modalStampsWrap: {
    position: "relative",
  },
  modalStamps: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 14,
  },
  modalStampButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.kimitoBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.kimitoBorderSoft,
  },
  modalStampButtonActive: {
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlueSoft,
  },
  modalStampEmoji: {
    fontSize: 26,
  },
  floatLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  floatingEmoji: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    fontSize: 30,
  },
  stampConfirm: {
    color: palette.kimitoBlue,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  modalXButton: {
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalFollowButton: {
    backgroundColor: palette.xBlack,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginBottom: 12,
  },
  modalFollowButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  modalXButtonText: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "700",
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
});
