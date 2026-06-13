import { View, Text, Pressable, StyleSheet, Modal, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/lib/tutorial-context";
import * as Haptics from "expo-haptics";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { navigate } from "@/lib/navigation";

// キャラクター画像
const characterImage = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

interface LoginPromptModalProps {
  visible: boolean;
  onLogin: () => void;
  onSkip: () => void;
}

/**
 * チュートリアル完了後のログイン誘導モーダル
 * 
 * 導線強化版：
 * - 「次に何をすればいいか」を明確に
 * - ファン向け：チャレンジを探す
 * - 主催者向け：チャレンジを作成
 * - ログインは任意（押し付けない）
 */
export function LoginPromptModal({ visible, onLogin, onSkip }: LoginPromptModalProps) {
  const colors = useColors();
  const { login } = useAuth();
  const { userType } = useTutorial();
  
  
  // キャラクターのワクワクアニメーション
  const bounce = useSharedValue(0);
  const sparkle = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // 静的な表示（ちかちかアニメーション削除）
      bounce.value = withTiming(0, { duration: 300 });
      sparkle.value = withTiming(1, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  
  const characterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));
  
  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
  }));
  
  const handleLogin = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLogin();
    try {
      await login();
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  
  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSkip();
  };
  
  // メインアクション（ユーザータイプに応じて変更）
  const handleMainAction = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSkip(); // モーダルを閉じる
    
    if (userType === "host") {
      // 主催者向け：チャレンジ作成画面へ
      navigate.toCreate();
    } else {
      // ファン向け：ホーム画面（チャレンジ一覧）へ
      navigate.toHome();
    }
  };
  
  if (!visible) return null;
  
  // ユーザータイプに応じたメッセージ
  const isHost = userType === "host";
  const title = "準備完了！";
  const subtitle = isHost 
    ? "さっそくチャレンジを作ってみよう"
    : "気になるチャレンジを探してみよう";
  const mainButtonText = isHost 
    ? "チャレンジを作成する"
    : "チャレンジを探す";
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.container}
        >
          {/* 背景グラデーション */}
          <LinearGradient
            colors={[color.surface, color.bg]}
            style={styles.gradient}
          />
          
          {/* キラキラエフェクト */}
          <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
            <Text style={styles.sparkle}>✨</Text>
            <Text style={[styles.sparkle, { top: 20, right: 30 }]}>⭐</Text>
            <Text style={[styles.sparkle, { bottom: 60, left: 20 }]}>✨</Text>
          </Animated.View>
          
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
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>
          
          {/* メインアクションボタン（チャレンジを探す/作成する） */}
          <Pressable
            onPress={handleMainAction}
            style={({ pressed }) => [
              styles.mainButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
          >
            <LinearGradient
              colors={isHost ? [color.hostAccentLegacy, color.warning] : [color.accentPrimary, color.pink400]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mainButtonGradient}
            >
              <Text style={styles.mainButtonText}>{mainButtonText}</Text>
            </LinearGradient>
          </Pressable>
          
          {/* ログインボタン（サブ） */}
          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={[styles.loginButtonText, { color: colors.foreground }]}>
              ログインして記録を残す
            </Text>
          </Pressable>
          
          {/* 説明テキスト */}
          <Text style={[styles.helperText, { color: colors.muted }]}>
            ログインすると参加履歴が保存されます
          </Text>
          
          {/* スキップボタン */}
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={[styles.skipButtonText, { color: colors.muted }]}>
              あとで
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "CC", // 80% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
    top: 30,
    left: 30,
  },
  characterContainer: {
    marginBottom: 20,
  },
  character: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  mainButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: color.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  mainButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  mainButtonText: {
    color: color.textWhite,
    fontSize: 17,
    fontWeight: "bold",
  },
  loginButton: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.white + "33", // 20% opacity
    backgroundColor: palette.white + "0D", // 5% opacity
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
  },
});
