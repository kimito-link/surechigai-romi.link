import { View, Text, Modal, Pressable, StyleSheet, Dimensions, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// キャラクター画像
const characterImages = {
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
};

interface FollowSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  targetUsername?: string;
  targetDisplayName?: string;
}

/**
 * フォロー完了お祝いモーダル
 * プレミアム機能が解放されたときに表示
 */
export function FollowSuccessModal({
  visible,
  onClose,
  targetUsername = "idolfunch",
  targetDisplayName = "君斗りんく",
}: FollowSuccessModalProps) {
  // アニメーション値
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const characterScale = useSharedValue(0);
  const starScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const hasPlayedHaptic = useRef(false);

  // モーダルが表示されたときのアニメーション
  useEffect(() => {
    if (visible) {
      // ハプティックフィードバック
      if (!hasPlayedHaptic.current && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        hasPlayedHaptic.current = true;
      }

      // アニメーションシーケンス
      opacity.value = withSpring(1, { damping: 15 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      characterScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 80 }));
      starScale.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 100 }));
      confettiOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
    } else {
      // リセット
      opacity.value = 0;
      scale.value = 0.5;
      characterScale.value = 0;
      starScale.value = 0;
      confettiOpacity.value = 0;
      hasPlayedHaptic.current = false;
    }
  }, [visible, opacity, scale, characterScale, starScale, confettiOpacity]);

  // アニメーションスタイル
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const characterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: characterScale.value }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* 紙吹雪エフェクト */}
          <Animated.View style={[styles.confettiContainer, confettiStyle]}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.confetti,
                  {
                    left: `${(i * 8) + 4}%`,
                    top: `${Math.random() * 30}%`,
                    backgroundColor: [color.accentPrimary, color.orange500, palette.amber400, color.success, color.info][i % 5],
                    transform: [{ rotate: `${Math.random() * 360}deg` }],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* スターアイコン */}
          <Animated.View style={[styles.starContainer, starStyle]}>
            <MaterialIcons name="star" size={48} color={palette.amber400} />
          </Animated.View>

          {/* キャラクター */}
          <Animated.View style={[styles.characterContainer, characterStyle]}>
            <Image
              source={characterImages.linkYukkuri}
              style={styles.characterImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* メッセージ */}
          <View style={styles.messageContainer}>
            <Text style={styles.title}>🎉 おめでとう！</Text>
            <Text style={styles.subtitle}>プレミアム機能が解放されました</Text>
            
            <View style={styles.followInfo}>
              <MaterialIcons name="check-circle" size={20} color={color.success} />
              <Text style={styles.followText}>
                @{targetUsername}をフォロー中
              </Text>
            </View>

            <View style={styles.featureList}>
              <Text style={styles.featureTitle}>使える機能:</Text>
              <View style={styles.featureItem}>
                <MaterialIcons name="add-circle" size={16} color={color.accentPrimary} />
                <Text style={styles.featureText}>チャレンジ作成</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="analytics" size={16} color={color.accentPrimary} />
                <Text style={styles.featureText}>統計ダッシュボード</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="people" size={16} color={color.accentPrimary} />
                <Text style={styles.featureText}>コラボ機能</Text>
              </View>
            </View>
          </View>

          {/* 閉じるボタン */}
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>さっそく使ってみる！</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "CC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: color.surface,
    borderRadius: 24,
    padding: 24,
    width: Math.min(SCREEN_WIDTH - 40, 360),
    alignItems: "center",
    borderWidth: 2,
    borderColor: color.accentPrimary,
    position: "relative",
    overflow: "hidden",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  confetti: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  starContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  characterContainer: {
    marginBottom: 16,
  },
  characterImage: {
    width: 100,
    height: 100,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: color.accentPrimary,
    marginBottom: 16,
    fontWeight: "600",
  },
  followInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.green500 + "1A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  followText: {
    color: color.success,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  featureList: {
    width: "100%",
    backgroundColor: palette.pink500 + "1A",
    borderRadius: 12,
    padding: 12,
  },
  featureTitle: {
    color: color.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureText: {
    color: color.textWhite,
    fontSize: 14,
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
  },
  closeButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
