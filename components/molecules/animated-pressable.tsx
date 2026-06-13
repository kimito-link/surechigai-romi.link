import { Pressable, PressableProps, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { haptics } from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends Omit<PressableProps, "style"> {
  style?: ViewStyle;
  /** スケールアニメーションの強さ（デフォルト: 0.97） */
  scaleAmount?: number;
  /** アニメーション時間（ms）（デフォルト: 100） */
  duration?: number;
  /** ハプティクスフィードバックを有効にするか（デフォルト: true） */
  haptic?: boolean;
  /** ハプティクスの種類（デフォルト: "light"） */
  hapticType?: "light" | "medium" | "heavy" | "selection";
  children: React.ReactNode;
}

/**
 * スムーズなアニメーション付きプレスコンポーネント
 * - タップ時に軽いスケールダウンアニメーション
 * - ハプティクスフィードバック
 * - スムーズなイージング
 */
export function AnimatedButton({
  style,
  scaleAmount = 0.97,
  duration = 100,
  haptic = true,
  hapticType = "light",
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...props
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = (e: any) => {
    scale.value = withTiming(scaleAmount, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(0.9, { duration });
    
    if (haptic) {
      switch (hapticType) {
        case "medium":
          haptics.mediumTap();
          break;
        case "heavy":
          haptics.heavyTap();
          break;
        case "selection":
          haptics.selection();
          break;
        default:
          haptics.lightTap();
      }
    }
    
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, {
      duration: duration * 1.5,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, { duration: duration * 1.5 });
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * リスト項目用のアニメーション付きプレスコンポーネント
 * - より控えめなアニメーション
 * - 背景色の変化
 */
export function AnimatedListItem({
  style,
  children,
  ...props
}: AnimatedButtonProps) {
  return (
    <AnimatedButton
      style={style}
      scaleAmount={0.99}
      duration={80}
      hapticType="selection"
      {...props}
    >
      {children}
    </AnimatedButton>
  );
}

/**
 * カード用のアニメーション付きプレスコンポーネント
 * - 軽いスケールダウン
 * - シャドウの変化（視覚的な押し込み感）
 */
export function AnimatedCard({
  style,
  children,
  ...props
}: AnimatedButtonProps) {
  return (
    <AnimatedButton
      style={style}
      scaleAmount={0.98}
      duration={100}
      hapticType="light"
      {...props}
    >
      {children}
    </AnimatedButton>
  );
}
