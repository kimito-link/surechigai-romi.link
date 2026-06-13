import { useState, useCallback, useRef } from "react";
import { Pressable, Platform, StyleProp, ViewStyle } from "react-native";
import { Image, ImageSource } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// キャラクター表情セット
export interface CharacterExpressionSet {
  normal: ImageSource;
  happy: ImageSource;
  surprised: ImageSource;
  blink: ImageSource;
}

// りんくちゃんの表情セット
export const LINK_EXPRESSIONS: CharacterExpressionSet = {
  normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-closed.png"),
  happy: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  surprised: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
  blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-closed.png"),
};

type Expression = keyof CharacterExpressionSet;

interface InteractiveCharacterProps {
  expressions?: CharacterExpressionSet;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onTap?: () => void;
  enableHaptics?: boolean;
  tapSequence?: Expression[]; // タップ時の表情シーケンス
}

/**
 * タップ反応キャラクターコンポーネント
 * タップすると表情が変わり、ハプティクスフィードバックを返す
 * 
 * 使用例:
 * ```tsx
 * <InteractiveCharacter
 *   expressions={LINK_EXPRESSIONS}
 *   size={100}
 *   tapSequence={["surprised", "happy", "normal"]}
 * />
 * ```
 */
export function InteractiveCharacter({
  expressions = LINK_EXPRESSIONS,
  size = 100,
  style,
  onTap,
  enableHaptics = true,
  tapSequence = ["surprised", "happy", "normal"],
}: InteractiveCharacterProps) {
  const [currentExpression, setCurrentExpression] = useState<Expression>("normal");
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アニメーション値
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  const handleTap = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    triggerHaptic();
    onTap?.();

    // 前のタイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // スケールアニメーション
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // 軽い揺れ
    rotate.value = withSequence(
      withTiming(-8, { duration: 80 }),
      withTiming(8, { duration: 80 }),
      withTiming(-4, { duration: 60 }),
      withTiming(4, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );

    // 表情シーケンスを実行
    const runSequence = (index: number) => {
      if (index >= tapSequence.length) {
        setIsAnimating(false);
        return;
      }

      setCurrentExpression(tapSequence[index]);
      
      // 最後の表情は長めに表示
      const duration = index === tapSequence.length - 1 ? 500 : 200;
      
      timeoutRef.current = setTimeout(() => {
        runSequence(index + 1);
      }, duration);
    };

    runSequence(0);
  }, [isAnimating, triggerHaptic, onTap, tapSequence, scale, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Pressable onPress={handleTap} style={style}>
      <Animated.View style={animatedStyle}>
        <Image
          source={expressions[currentExpression]}
          style={{ width: size, height: size }}
          contentFit="contain"
          transition={50}
        />
      </Animated.View>
    </Pressable>
  );
}

/**
 * シンプルなタップ反応りんくちゃん
 */
export function TappableLink({
  size = 100,
  style,
  onTap,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
  onTap?: () => void;
}) {
  return (
    <InteractiveCharacter
      expressions={LINK_EXPRESSIONS}
      size={size}
      style={style}
      onTap={onTap}
      tapSequence={["surprised", "happy", "blink", "normal"]}
    />
  );
}

/**
 * 長押し対応のインタラクティブキャラクター
 */
export function LongPressCharacter({
  expressions = LINK_EXPRESSIONS,
  size = 100,
  style,
  onTap,
  onLongPress,
}: {
  expressions?: CharacterExpressionSet;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onTap?: () => void;
  onLongPress?: () => void;
}) {
  const [currentExpression, setCurrentExpression] = useState<Expression>("normal");
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    setCurrentExpression("surprised");
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    setCurrentExpression("normal");
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentExpression("happy");
    setTimeout(() => setCurrentExpression("normal"), 500);
    onTap?.();
  };

  const handleLongPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCurrentExpression("happy");
    setTimeout(() => setCurrentExpression("normal"), 800);
    onLongPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={expressions[currentExpression]}
          style={{ width: size, height: size }}
          contentFit="contain"
          transition={50}
        />
      </Animated.View>
    </Pressable>
  );
}
