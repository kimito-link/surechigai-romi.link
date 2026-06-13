import { useEffect, useState, useCallback } from "react";
import { Image, ImageSource } from "expo-image";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// キャラクター画像セット（通常、まばたき）
export interface CharacterImageSet {
  normal: ImageSource;
  blink: ImageSource;
}

// りんくの画像セット（主人公）
export const LINK_CHARACTER_SETS = {
  // 通常（口閉じ）
  normalClosed: {
    normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-closed.png"),
    blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-closed.png"),
  },
  // 通常（口開け）
  normalOpen: {
    normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
    blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-open.png"),
  },
  // 笑顔（口閉じ）
  smileClosed: {
    normal: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-closed.png"),
    blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-closed.png"),
  },
  // 笑顔（口開け）
  smileOpen: {
    normal: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
    blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-open.png"),
  },
  // 半目（口閉じ）
  halfClosed: {
    normal: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-closed.png"),
    blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-closed.png"),
  },
  // 半目（口開け）
  halfOpen: {
    normal: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-open.png"),
    blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-open.png"),
  },
};

interface BlinkingCharacterProps {
  imageSet: CharacterImageSet;
  size?: number;
  style?: StyleProp<ViewStyle>;
  blinkInterval?: number; // まばたきの間隔（ミリ秒）
  blinkDuration?: number; // まばたきの長さ（ミリ秒）
  enabled?: boolean; // アニメーションを有効にするか
}

/**
 * まばたきアニメーション付きキャラクターコンポーネント
 * 
 * 使用例:
 * ```tsx
 * <BlinkingCharacter
 *   imageSet={LINK_CHARACTER_SETS.normalClosed}
 *   size={100}
 *   blinkInterval={3000}
 * />
 * ```
 */
export function BlinkingCharacter({
  imageSet,
  size = 100,
  style,
  blinkInterval = 3000, // デフォルト3秒ごと
  blinkDuration = 150, // デフォルト150ms
  enabled = true,
}: BlinkingCharacterProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const opacity = useSharedValue(1);

  // まばたき処理
  const doBlink = useCallback(() => {
    if (!enabled) return;
    
    setIsBlinking(true);
    
    // 短い遅延後に通常に戻す
    setTimeout(() => {
      setIsBlinking(false);
    }, blinkDuration);
  }, [enabled, blinkDuration]);

  // 定期的にまばたき
  useEffect(() => {
    if (!enabled) return;

    // 初回は少し遅らせる
    const initialDelay = setTimeout(() => {
      doBlink();
    }, 1000);

    // 定期的にまばたき
    const interval = setInterval(() => {
      doBlink();
    }, blinkInterval);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [enabled, blinkInterval, doBlink]);

  // フェードアニメーション（オプション）
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style, animatedStyle]}>
      <Image
        source={isBlinking ? imageSet.blink : imageSet.normal}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={50} // 滑らかな切り替え
      />
    </Animated.View>
  );
}

/**
 * シンプルなまばたきキャラクター（りんくちゃん専用）
 * プリセットを使って簡単に使用できる
 */
export function BlinkingLink({
  variant = "normalClosed",
  size = 100,
  style,
  blinkInterval = 3000,
  enabled = true,
}: {
  variant?: keyof typeof LINK_CHARACTER_SETS;
  size?: number;
  style?: StyleProp<ViewStyle>;
  blinkInterval?: number;
  enabled?: boolean;
}) {
  return (
    <BlinkingCharacter
      imageSet={LINK_CHARACTER_SETS[variant]}
      size={size}
      style={style}
      blinkInterval={blinkInterval}
      enabled={enabled}
    />
  );
}
