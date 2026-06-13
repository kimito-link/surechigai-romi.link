import { useState } from "react";
import { color } from "@/theme/tokens";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Image, ImageSource } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ProgressiveImageProps {
  source: ImageSource;
  /** プレースホルダー画像（低解像度やぼかし画像） */
  placeholder?: ImageSource;
  /** プレースホルダーのぼかし半径（デフォルト: 20） */
  blurRadius?: number;
  style?: ViewStyle;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** フェードイン時間（ms）（デフォルト: 300） */
  fadeDuration?: number;
}

/**
 * プログレッシブ画像読み込みコンポーネント
 * - 最初にぼかしたプレースホルダーを表示
 * - 高解像度画像が読み込まれたらフェードインで切り替え
 */
export function ProgressiveImage({
  source,
  placeholder,
  blurRadius = 20,
  style,
  contentFit = "cover",
  fadeDuration = 300,
}: ProgressiveImageProps) {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleLoad = () => {
    opacity.value = withTiming(1, {
      duration: fadeDuration,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* プレースホルダー（ぼかし画像） */}
      <Image
        source={placeholder || source}
        style={[StyleSheet.absoluteFill]}
        contentFit={contentFit}
        blurRadius={blurRadius}
        cachePolicy="memory-disk"
      />
      
      {/* 高解像度画像 */}
      <AnimatedImage
        source={source}
        style={[StyleSheet.absoluteFill, animatedStyle]}
        contentFit={contentFit}
        onLoad={handleLoad}
        cachePolicy="memory-disk"
        transition={0} // 独自のアニメーションを使用
      />
    </View>
  );
}

interface ProgressiveAvatarProps {
  source: ImageSource;
  size?: number;
  /** フォールバック時の背景色 */
  fallbackColor?: string;
  /** フォールバック時のテキスト（名前の頭文字など） */
  fallbackText?: string;
}

/**
 * プログレッシブアバター画像コンポーネント
 * - 読み込み中はグラデーションプレースホルダー
 * - 読み込み完了でフェードイン
 */
export function ProgressiveAvatar({
  source,
  size = 40,
  fallbackColor = color.accentPrimary,
  fallbackText,
}: ProgressiveAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleLoad = () => {
    setIsLoaded(true);
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackColor,
        },
      ]}
    >
      {/* プレースホルダー（シマーアニメーション風） */}
      {!isLoaded && !hasError && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              backgroundColor: fallbackColor,
              opacity: 0.7,
            },
          ]}
        />
      )}
      
      {/* フォールバックテキスト */}
      {hasError && fallbackText && (
        <View style={[StyleSheet.absoluteFill, styles.fallbackTextContainer]}>
          <Animated.Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
            {fallbackText.charAt(0).toUpperCase()}
          </Animated.Text>
        </View>
      )}
      
      {/* 実際の画像 */}
      {!hasError && (
        <AnimatedImage
          source={source}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size / 2 },
            animatedStyle,
          ]}
          contentFit="cover"
          onLoad={handleLoad}
          onError={handleError}
          cachePolicy="memory-disk"
          transition={0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  avatarContainer: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    color: color.textWhite,
    fontWeight: "bold",
  },
});
