import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";
import { navigate } from "@/lib/navigation";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

// キャラクター画像（こん太）
const characterImage = require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png");

/**
 * 主催者向け空状態画面
 * チャレンジがない時に表示
 * 
 * 任天堂原則：
 * - 説明しない（短いメッセージ）
 * - 次のアクションを明確に
 * - キャラクターで親しみやすく
 */
export function HostEmptyState() {
  const colors = useColors();
  
  
  // キャラクターのワクワクアニメーション
  const bounce = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    // 静的な表示（ちかちかアニメーション削除）
    bounce.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const characterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { scale: scale.value },
    ],
  }));
  
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // 作成タブへ遷移
    navigate.toCreateTab();
  };
  
  return (
    <View style={styles.container}>
      {/* キャラクター */}
      <Animated.View style={[styles.characterContainer, characterAnimatedStyle]}>
        <Image
          source={characterImage}
          style={styles.character}
          contentFit="contain"
        />
      </Animated.View>
      
      {/* メッセージ */}
      <Text style={[styles.title, { color: colors.foreground }]}>
        チャレンジを作ろう！
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        ファンと一緒に目標達成を目指そう
      </Text>
      
      {/* アクションボタン */}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={styles.buttonText}>最初のチャレンジを作る</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 32,
    paddingTop: 48,
  },
  characterContainer: {
    marginBottom: 24,
  },
  character: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: color.hostAccentLegacy,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: color.hostAccentLegacy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
});
