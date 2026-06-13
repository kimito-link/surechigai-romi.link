import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { BlinkingLink } from "@/components/atoms/blinking-character";

// ログインステップの定義
const LOGIN_STEPS = [
  {
    id: 1,
    title: "Twitter認証中...",
    subtitle: "Twitterに接続しています",
    icon: "🐦",
  },
  {
    id: 2,
    title: "ユーザー情報取得中...",
    subtitle: "プロフィールを読み込んでいます",
    icon: "👤",
  },
  {
    id: 3,
    title: "準備完了！",
    subtitle: "まもなくログインします",
    icon: "✨",
  },
];

// りんくちゃんの待機中セリフ
const WAITING_MESSAGES = [
  "もう少しだよ〜！",
  "Twitter認証中だよ！",
  "待っててね〜♪",
  "ログイン処理中...！",
  "あと少し！",
  "準備してるよ〜",
];

interface LoginLoadingScreenProps {
  currentStep?: number; // 1, 2, 3
  message?: string;
}

export function LoginLoadingScreen({
  currentStep = 1,
  message,
}: LoginLoadingScreenProps) {
  const colors = useColors();
  const [messageIndex, setMessageIndex] = useState(0);
  const [spinAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [bounceAnim] = useState(new Animated.Value(0));

  // スピンアニメーション
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  // パルスアニメーション
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // バウンスアニメーション
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, [bounceAnim]);

  // セリフを定期的に変更
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* キャラクター（りんくちゃん） */}
      <Animated.View
        style={[
          styles.characterContainer,
          { transform: [{ translateY: bounceAnim }] },
        ]}
      >
        <BlinkingLink
          variant="smileOpen"
          size={150}
          blinkInterval={2500}
        />
      </Animated.View>

      {/* セリフ吹き出し */}
      <View style={[styles.speechBubble, { backgroundColor: colors.surface }]}>
        <Text style={[styles.speechText, { color: colors.foreground }]}>
          {WAITING_MESSAGES[messageIndex]}
        </Text>
        <View
          style={[
            styles.speechBubbleTail,
            { borderTopColor: colors.surface },
          ]}
        />
      </View>

      {/* ローディングスピナー */}
      <Animated.View
        style={[
          styles.spinnerContainer,
          { transform: [{ rotate: spinInterpolate }] },
        ]}
      >
        <View style={[styles.spinner, { borderColor: colors.primary }]}>
          <View
            style={[styles.spinnerDot, { backgroundColor: colors.primary }]}
          />
        </View>
      </Animated.View>

      {/* 進捗インジケーター */}
      <View style={styles.stepsContainer}>
        {LOGIN_STEPS.map((step, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;
          return (
            <View key={step.id} style={styles.stepRow}>
              <Animated.View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor: isCompleted
                      ? colors.success
                      : isActive
                      ? colors.primary
                      : colors.surface,
                    transform: isActive ? [{ scale: pulseAnim }] : [],
                  },
                ]}
              >
                <Text style={styles.stepIconText}>
                  {isCompleted ? "✓" : step.icon}
                </Text>
              </Animated.View>
              <View style={styles.stepTextContainer}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: isActive
                        ? colors.foreground
                        : isCompleted
                        ? colors.success
                        : colors.muted,
                      fontWeight: isActive ? "bold" : "normal",
                    },
                  ]}
                >
                  {step.title}
                </Text>
                {isActive && (
                  <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
                    {step.subtitle}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* カスタムメッセージ */}
      {message && (
        <Text style={[styles.customMessage, { color: colors.muted }]}>
          {message}
        </Text>
      )}

      {/* 下部のヒント */}
      <Text style={[styles.hint, { color: colors.muted }]}>
        ログイン処理には少し時間がかかることがあります
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  characterContainer: {
    marginBottom: 8,
    marginTop: 40,
  },
  speechBubble: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
    position: "relative",
  },
  speechBubbleTail: {
    position: "absolute",
    bottom: -10,
    left: "50%",
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  speechText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepsContainer: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepIconText: {
    fontSize: 18,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
  },
  stepSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  customMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
});

export default LoginLoadingScreen;
