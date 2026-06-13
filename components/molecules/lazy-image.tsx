import { View, StyleSheet, Animated, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { Image, ImageProps } from "expo-image";
import { useState, useRef, useEffect, useCallback } from "react";

interface LazyImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackColor?: string;
  /** 遅延読み込みを有効にするか（デフォルト: true） */
  lazy?: boolean;
  /** 画面に入る前に読み込みを開始するマージン（ピクセル） */
  rootMargin?: number;
}

/**
 * 遅延読み込み対応の画像コンポーネント
 * - 画面に表示されるまで読み込みを遅延
 * - フェードインアニメーション
 * - プレースホルダー表示
 */
export function LazyImage({
  fallbackColor = color.border,
  lazy = true,
  rootMargin = 100,
  style,
  ...props
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewRef = useRef<View>(null);

  // Web用のIntersection Observer
  useEffect(() => {
    if (!lazy || Platform.OS !== "web") {
      setIsVisible(true);
      return;
    }

    // Web環境でのみIntersection Observerを使用
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: `${rootMargin}px`,
          threshold: 0,
        }
      );

      // viewRefのcurrentを取得
      const node = viewRef.current as unknown as Element;
      if (node) {
        observer.observe(node);
      }

      return () => observer.disconnect();
    } else {
      // Intersection Observerがサポートされていない場合は即座に表示
      setIsVisible(true);
    }
  }, [lazy, rootMargin]);

  // ネイティブ環境では常に表示（FlatListの最適化に任せる）
  useEffect(() => {
    if (Platform.OS !== "web") {
      setIsVisible(true);
    }
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // スタイルから幅と高さを抽出
  const flatStyle = StyleSheet.flatten(style) || {};
  const width = flatStyle.width || "100%";
  const height = flatStyle.height || 100;
  const borderRadius = flatStyle.borderRadius || 0;

  return (
    <View
      ref={viewRef}
      style={[styles.container, { width, height, borderRadius }]}
    >
      {/* プレースホルダー */}
      {!isLoaded && (
        <View style={[styles.placeholder, { backgroundColor: fallbackColor, borderRadius }]} />
      )}

      {/* 画像（表示されるまで読み込まない） */}
      {isVisible && !hasError && (
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <Image
            {...props}
            style={[style, { width: "100%", height: "100%" }]}
            onLoad={handleLoad}
            onError={handleError}
            // 低優先度で読み込み
            priority={lazy ? "low" : "normal"}
            // メモリキャッシュを活用
            cachePolicy="memory-disk"
          />
        </Animated.View>
      )}

      {/* エラー時のフォールバック */}
      {hasError && (
        <View style={[styles.fallback, { backgroundColor: fallbackColor, borderRadius }]} />
      )}
    </View>
  );
}

/**
 * 遅延読み込み対応のアバターコンポーネント
 */
export function LazyAvatar({
  size = 48,
  fallbackText,
  fallbackColor = color.info,
  ...props
}: LazyImageProps & { size?: number; fallbackText?: string }) {
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // sourceがない、またはエラーの場合はフォールバック表示
  const showFallback = !props.source || hasError;

  const handleLoad = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (showFallback) {
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
          <Animated.Text style={{ color: color.textWhite, fontSize: size * 0.4, fontWeight: "bold" }}>
            {fallbackText}
          </Animated.Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: fallbackColor,
      }}
    >
      <Animated.View style={{ opacity: fadeAnim, width: "100%", height: "100%" }}>
        <Image
          {...props}
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            props.style,
          ]}
          onLoad={handleLoad}
          onError={handleError}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
