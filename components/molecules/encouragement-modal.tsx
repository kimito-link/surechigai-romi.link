import { View, Text, Pressable, StyleSheet, Modal, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useEffect, useState, useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EmojiIcon } from "@/components/ui/emoji-icon";
import * as Haptics from "expo-haptics";

interface EncouragementModalProps {
  visible: boolean;
  onClose: () => void;
  type: "participation" | "achievement" | "milestone" | "welcome";
  customMessage?: string;
  customEmoji?: string;
}

// 励ましメッセージのプリセット
const MESSAGES = {
  participation: [
    { title: "参加表明ありがとう！", message: "あなたの一歩が、推しの夢を叶える力になります🌟", emoji: "🎉" },
    { title: "素敵な応援！", message: "一人ひとりの想いが、大きな力になります💪", emoji: "✨" },
    { title: "ありがとうございます！", message: "あなたの参加が、みんなの勇気になります🌈", emoji: "💕" },
    { title: "おつかれさまです！", message: "一つひとつの応援が、推しの成長の証です🌈 素敵な参加をありがとう💕", emoji: "🙌" },
  ],
  achievement: [
    { title: "目標達成！", message: "みんなの力で夢を叶えました！おめでとうございます🎊", emoji: "🏆" },
    { title: "やったね！", message: "チャレンジ成功！あなたの応援が実を結びました✨", emoji: "🎉" },
    { title: "すごい！", message: "目標達成おめでとう！これからも一緒に応援しよう🌟", emoji: "🥳" },
  ],
  milestone: [
    { title: "マイルストーン達成！", message: "50%突破！ゴールまであと少し💪", emoji: "🔥" },
    { title: "順調です！", message: "みんなの応援で着実に前進中！", emoji: "📈" },
    { title: "いい調子！", message: "この調子で目標達成を目指そう！", emoji: "⭐" },
  ],
  welcome: [
    { title: "ようこそ！", message: "動員ちゃれんじへようこそ！一緒に推しを応援しよう🌟", emoji: "👋" },
    { title: "はじめまして！", message: "あなたの参加を待っていました！素敵な応援ライフを✨", emoji: "🎵" },
  ],
};

/**
 * 励ましメッセージモーダルコンポーネント
 * 「しゃべった！」アプリを参考にした、ポジティブなフィードバックUI
 */
export function EncouragementModal({
  visible,
  onClose,
  type,
  customMessage,
  customEmoji,
}: EncouragementModalProps) {
  const [messageData, setMessageData] = useState<{ title: string; message: string; emoji: string } | null>(null);

  // メッセージをランダムに選択
  useEffect(() => {
    if (visible) {
      const messages = MESSAGES[type];
      const randomIndex = Math.floor(Math.random() * messages.length);
      setMessageData(messages[randomIndex]);
      
      // ハプティクスフィードバック
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [visible, type]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  if (!messageData) return null;

  const displayMessage = customMessage || messageData.message;
  const displayEmoji = customEmoji || messageData.emoji;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 閉じるボタン */}
          <Pressable 
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleClose}
          >
            <MaterialIcons name="close" size={24} color={color.textSubtle} />
          </Pressable>

          {/* メインコンテンツ */}
          <View style={styles.content}>
            {/* 絵文字 → FontAwesomeアイコン */}
            <EmojiIcon emoji={displayEmoji} size={48} />

            {/* タイトル */}
            <Text style={styles.title}>{messageData.title}</Text>

            {/* メッセージ */}
            <Text style={styles.message}>{displayMessage}</Text>
          </View>

          {/* 閉じるボタン */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleClose}
          >
            <Text style={styles.actionButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 励ましメッセージを表示するためのフック
 */
export function useEncouragementModal() {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<"participation" | "achievement" | "milestone" | "welcome">("participation");
  const [customMessage, setCustomMessage] = useState<string | undefined>();
  const [customEmoji, setCustomEmoji] = useState<string | undefined>();

  const show = useCallback((
    messageType: "participation" | "achievement" | "milestone" | "welcome",
    options?: { message?: string; emoji?: string }
  ) => {
    setType(messageType);
    setCustomMessage(options?.message);
    setCustomEmoji(options?.emoji);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    type,
    customMessage,
    customEmoji,
    show,
    hide,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "99",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: color.textWhite,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    position: "relative",
    // シャドウ
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
  },
  content: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: color.surfaceAlt,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: color.textSubtle,
    textAlign: "center",
    lineHeight: 24,
  },
  actionButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.textPrimary,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: color.borderAlt,
  },
});

export default EncouragementModal;
