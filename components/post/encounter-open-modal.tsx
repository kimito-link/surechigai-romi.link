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
} from "@/lib/post/encounter-shared";
import { color, palette } from "@/theme/tokens";

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!item) return null;

  const tierColor = TIER_COLORS[item.tier] || color.accentPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalCard, animStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalTierBanner,
                {
                  backgroundColor: tierColor + "33",
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
                    textShadowColor: tierColor,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  },
                ]}
              >
                {TIER_LABELS[item.tier] || `Tier ${item.tier}`} シグナルデコード成功
              </Text>
            </View>

            <View style={styles.modalAvatarWrap}>
              <View style={[styles.modalAvatar, { borderColor: tierColor }]}>
                <MaterialIcons name="account-circle" size={64} color={color.textMuted} />
              </View>
            </View>

            <Text style={styles.modalName} numberOfLines={2}>
              {item.partnerName || "ロミユーザー"}
            </Text>

            <Text style={styles.modalArea} numberOfLines={2}>
              {item.areaName || item.prefecture || "不明なエリア"}
            </Text>

            {item.partnerHitokoto && (
              <View style={styles.modalHitokotoWrap}>
                <Text style={styles.modalHitokoto} numberOfLines={4}>
                  {item.partnerHitokoto}
                </Text>
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

            {item.partnerName && (
              <Pressable
                onPress={() => Linking.openURL(`https://x.com/${item.partnerName}`)}
                style={({ pressed }) => [styles.modalXButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.modalXButtonText} numberOfLines={1}>
                  X プロフィールを見る @{item.partnerName}
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
  modalStampsWrap: {
    position: "relative",
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  modalStampButtonActive: {
    borderColor: color.teal500,
    backgroundColor: color.teal500 + "22",
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
    color: color.teal500,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
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
});
