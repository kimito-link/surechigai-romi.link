import { View, Text, Pressable, Modal, StyleSheet, Animated, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useRef, useEffect } from "react";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { BrandTagline } from "@/components/molecules/brand-tagline";

// キャラクター画像（半目で寂しそうな表情）
const characterImage = require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-closed.png");

interface LogoutConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ログアウト確認モーダル（キャラクター付き）
 * かわいいデザインでユーザーに確認を求める
 */
export function LogoutConfirmModal({
  visible,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const characterBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // モーダル表示アニメーション
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // キャラクターの揺れアニメーション
      Animated.loop(
        Animated.sequence([
          Animated.timing(characterBounce, {
            toValue: -5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(characterBounce, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      characterBounce.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, characterBounce]);

  const handleConfirm = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm();
  };

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.overlay}
        onPress={handleCancel}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable>
            {/* キャラクターと吹き出し */}
            <View style={styles.characterSection}>
              <Animated.View
                style={[
                  styles.characterContainer,
                  { transform: [{ translateY: characterBounce }] },
                ]}
              >
                <Image
                  source={characterImage}
                  style={styles.character}
                  contentFit="contain"
                />
              </Animated.View>
              
              {/* 吹き出し */}
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>えっ、もう帰っちゃうの？😢</Text>
                <View style={styles.speechTail} />
              </View>
            </View>

            {/* タイトル */}
            <Text style={styles.title}>ログアウト</Text>

            {/* メッセージ */}
            <Text style={styles.message}>
              ログアウトしますか？{"\n"}
              またいつでも遊びに来てね！
            </Text>

            {/* ブランドの核（ログアウト時もそっと残す） */}
            <View style={styles.taglineWrap}>
              <BrandTagline compact align="center" />
            </View>

            {/* ボタン */}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name="favorite" size={18} color={color.accentPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.cancelButtonText}>まだいる！</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name="logout" size={18} color={color.textWhite} style={{ marginRight: 6 }} />
                <Text style={styles.confirmButtonText}>またね！</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "B3",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: color.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.pink500 + "4D",
  },
  characterSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  characterContainer: {
    marginBottom: 8,
  },
  character: {
    width: 100,
    height: 100,
  },
  speechBubble: {
    backgroundColor: palette.kimitoBlueSoft,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "relative",
  },
  speechText: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "700",
  },
  speechTail: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: palette.kimitoBlueSoft,
  },
  title: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 22,
  },
  taglineWrap: {
    marginBottom: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: palette.pink500 + "26",
    borderWidth: 1,
    borderColor: palette.pink500 + "4D",
  },
  cancelButtonText: {
    color: color.accentPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: color.textSubtle,
  },
  confirmButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
  },
});
