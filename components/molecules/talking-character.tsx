import { useState, useCallback, useRef, useEffect } from "react";
import { color } from "@/theme/tokens";
import { View, Text, Pressable, Platform, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// キャラクター表情
const CHARACTER_EXPRESSIONS = {
  normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-closed.png"),
  happy: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  surprised: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
  wink: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-closed.png"),
};

type Expression = keyof typeof CHARACTER_EXPRESSIONS;

// セリフバリエーション
const RANDOM_MESSAGES = [
  { text: "がんばって！✨", expression: "happy" as Expression },
  { text: "応援してるよ！💪", expression: "happy" as Expression },
  { text: "一緒に盛り上げよう！🎉", expression: "happy" as Expression },
  { text: "今日もお疲れさま！", expression: "wink" as Expression },
  { text: "推しのために！💖", expression: "happy" as Expression },
  { text: "えへへ♪", expression: "wink" as Expression },
  { text: "タップありがとう！", expression: "happy" as Expression },
  { text: "わくわく！", expression: "happy" as Expression },
  { text: "ふぁいと〜！", expression: "happy" as Expression },
];

// 達成時のセリフ
export const ACHIEVEMENT_MESSAGES = [
  { text: "やったー！達成おめでとう！🎊", expression: "happy" as Expression },
  { text: "すごい！目標達成！✨", expression: "happy" as Expression },
  { text: "おめでとう！最高だね！🎉", expression: "happy" as Expression },
];

interface TalkingCharacterProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  messages?: { text: string; expression: Expression }[];
  bubblePosition?: "top" | "bottom";
  enableHaptics?: boolean;
}

export function TalkingCharacter({
  size = 80,
  style,
  messages = RANDOM_MESSAGES,
  bubblePosition = "top",
  enableHaptics = true,
}: TalkingCharacterProps) {
  const [currentExpression, setCurrentExpression] = useState<Expression>("normal");
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const lastMessageIndex = useRef(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  const handleTap = useCallback(() => {
    triggerHaptic();

    // アニメーション
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    rotate.value = withSequence(
      withTiming(-8, { duration: 80 }),
      withTiming(8, { duration: 80 }),
      withTiming(0, { duration: 60 })
    );

    // ランダムメッセージ選択
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * messages.length);
    } while (newIndex === lastMessageIndex.current && messages.length > 1);
    
    lastMessageIndex.current = newIndex;
    const message = messages[newIndex];

    setCurrentExpression(message.expression);
    setCurrentMessage(message.text);
    setShowBubble(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowBubble(false);
      setCurrentExpression("normal");
    }, 3000);
  }, [triggerHaptic, messages, scale, rotate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={[styles.container, style]}>
      {showBubble && currentMessage && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.bubble, bubblePosition === "top" ? styles.bubbleTop : styles.bubbleBottom]}
        >
          <Text style={styles.bubbleText}>{currentMessage}</Text>
        </Animated.View>
      )}
      <Pressable onPress={handleTap}>
        <Animated.View style={animatedStyle}>
          <Image
            source={CHARACTER_EXPRESSIONS[currentExpression]}
            style={{ width: size, height: size }}
            contentFit="contain"
            transition={50}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function HeaderTalkingCharacter({ size = 40, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return <TalkingCharacter size={size} style={style} bubblePosition="bottom" />;
}

const styles = StyleSheet.create({
  container: { position: "relative", alignItems: "center", justifyContent: "center" },
  bubble: {
    position: "absolute",
    backgroundColor: color.accentPrimary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    maxWidth: 180,
    zIndex: 10,
  },
  bubbleTop: { bottom: "100%", marginBottom: 8 },
  bubbleBottom: { top: "100%", marginTop: 8 },
  bubbleText: { color: color.textWhite, fontSize: 13, fontWeight: "600", textAlign: "center" },
});
