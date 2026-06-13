import { useEffect, useCallback } from "react";
import { color } from "@/theme/tokens";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

// キャラクター画像（りんく・こん太・たぬ姉のオリジナル画像を統一使用）
const CHARACTER_IMAGES = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

type CharacterType = "rinku" | "konta" | "tanune";

interface InlineValidationErrorProps {
  message: string;
  visible: boolean;
  character?: CharacterType;
}

/**
 * 入力フィールドの近くに表示するインラインバリデーションエラー
 * 吹き出し形式でキャラクターがエラーメッセージを伝える
 * 
 * v6.53: アニメーションを削除してシンプルに（スマホでの表示問題を修正）
 */
export function InlineValidationError({ 
  message, 
  visible, 
  character = "rinku" 
}: InlineValidationErrorProps) {
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      triggerHaptic();
    }
  }, [visible, triggerHaptic]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* キャラクター */}
        <Image
          source={CHARACTER_IMAGES[character]}
          style={styles.character}
          contentFit="contain"
        />
        
        {/* 吹き出し */}
        <View style={styles.bubble}>
          <View style={styles.bubbleArrow} />
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  character: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  bubble: {
    flex: 1,
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "relative",
  },
  bubbleArrow: {
    position: "absolute",
    left: -6,
    top: "50%",
    marginTop: -5,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: color.accentPrimary,
  },
  bubbleText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "600",
  },
});
