import { View, StyleSheet, Animated, Text } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Image, ImageProps, ImageSource } from "expo-image";
import { useState, useRef, useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { optimizeImageUrl, IMAGE_SIZE_PRESETS } from "@/lib/image-format";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackColor?: string;
  showPlaceholder?: boolean;
  placeholderType?: "shimmer" | "blur" | "solid";
  /** WebP最適化を有効にする */
  optimizeFormat?: boolean;
  /** 画像サイズプリセット */
  sizePreset?: keyof typeof IMAGE_SIZE_PRESETS;
}

/**
 * 最適化された画像コンポーネント
 * - 読み込み中のプレースホルダー表示
 * - フェードインアニメーション
 * - エラー時のフォールバック
 */
export function OptimizedImage({
  fallbackColor = color.border,
  showPlaceholder = true,
  placeholderType = "shimmer",
  optimizeFormat = true,
  sizePreset,
  style,
  source,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // 画像ソースを最適化（WebP変換等）
  const optimizedSource = useOptimizedSource(source as ImageSource | undefined, optimizeFormat, sizePreset);

  useEffect(() => {
    if (showPlaceholder && placeholderType === "shimmer") {
      const animation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [shimmerAnim, showPlaceholder, placeholderType]);

  const handleLoad = () => {
    setIsLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // スタイルから幅と高さを抽出
  const flatStyle = StyleSheet.flatten(style) || {};
  const width = flatStyle.width || "100%";
  const height = flatStyle.height || 100;
  const borderRadius = flatStyle.borderRadius || 0;

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      {/* プレースホルダー */}
      {showPlaceholder && isLoading && !hasError && (
        <View style={[styles.placeholder, { backgroundColor: fallbackColor, borderRadius }]}>
          {placeholderType === "shimmer" && (
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <LinearGradient
                colors={["transparent", palette.white + "1A", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              />
            </Animated.View>
          )}
        </View>
      )}

      {/* エラー時のフォールバック */}
      {hasError && (
        <View style={[styles.fallback, { backgroundColor: fallbackColor, borderRadius }]} />
      )}

      {/* 実際の画像 */}
      {!hasError && (
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <Image
            {...props}
            source={optimizedSource}
            style={[style, styles.image]}
            onLoad={handleLoad}
            onError={handleError}
            cachePolicy="memory-disk"
            transition={300}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * 画像ソースを最適化するヘルパー関数
 */
function useOptimizedSource(
  source: ImageSource | undefined,
  optimizeFormat: boolean,
  sizePreset?: keyof typeof IMAGE_SIZE_PRESETS
): ImageSource | undefined {
  return useMemo(() => {
    if (!source || !optimizeFormat) return source;

    // URIがある場合のみ最適化
    if (typeof source === "object" && "uri" in source && source.uri) {
      const preset = sizePreset ? IMAGE_SIZE_PRESETS[sizePreset] : undefined;
      const optimizedUri = optimizeImageUrl(source.uri, {
        width: preset?.width,
        height: preset?.height,
        quality: preset?.quality,
      });
      return { ...source, uri: optimizedUri };
    }

    return source;
  }, [source, optimizeFormat, sizePreset]);
}

/**
 * アバター画像用の最適化コンポーネント
 */
export function OptimizedAvatar({
  size = 48,
  fallbackText,
  fallbackColor = color.info,
  ...props
}: OptimizedImageProps & { size?: number; fallbackText?: string }) {
  const showFallback = !props.source;

  // sourceがない場合はフォールバックを表示
  if (showFallback || !props.source) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {fallbackText && (
          <Text style={{ color: color.textWhite, fontSize: size * 0.4, fontWeight: "bold" }}>
            {fallbackText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <OptimizedImage
      {...props}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        props.style,
      ]}
      fallbackColor={fallbackColor}
    />
  );
}

/**
 * サムネイル画像用の最適化コンポーネント
 */
export function OptimizedThumbnail({
  aspectRatio = 16 / 9,
  ...props
}: OptimizedImageProps & { aspectRatio?: number }) {
  return (
    <OptimizedImage
      {...props}
      style={[
        {
          width: "100%",
          aspectRatio,
          borderRadius: 12,
        },
        props.style,
      ]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    width: 200,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
