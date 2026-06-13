/**
 * CharacterLoadingIndicator
 * キャラクターを使った可愛いローディングインジケーター
 */

import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Image } from "expo-image";
import { color } from "@/theme/tokens";

// ローディングメッセージのバリエーション
const LOADING_MESSAGES = [
  "読み込み中...",
  "もうちょっと待ってね！",
  "がんばって探してるよ！",
  "もう少しだよ〜",
  "わくわく...",
];

// スクロール時のメッセージ
const SCROLL_MESSAGES = [
  "もっと見る？",
  "まだまだあるよ！",
  "下にスクロール！",
  "続きを見てね♪",
];

// りんくちゃんの画像
const LINK_IMAGES = {
  normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-closed.png"),
  smile: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-closed.png"),
};

interface CharacterLoadingIndicatorProps {
  /** ローディング中かどうか */
  isLoading?: boolean;
  /** 次のページがあるかどうか */
  hasNextPage?: boolean;
  /** 表示サイズ */
  size?: "small" | "medium" | "large";
  /** カスタムメッセージ */
  message?: string;
  /** バリアント */
  variant?: "loading" | "scroll" | "empty";
}

export function CharacterLoadingIndicator({
  isLoading = false,
  hasNextPage = false,
  size = "medium",
  message,
  variant = "loading",
}: CharacterLoadingIndicatorProps) {
  const [currentMessage, setCurrentMessage] = useState(
    message || (variant === "scroll" ? SCROLL_MESSAGES[0] : LOADING_MESSAGES[0])
  );
  const [isBlinking, setIsBlinking] = useState(false);
  
  // アニメーション値
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // サイズ設定
  const sizeConfig = {
    small: { image: 40, fontSize: 12 },
    medium: { image: 60, fontSize: 14 },
    large: { image: 80, fontSize: 16 },
  };
  const config = sizeConfig[size];

  // バウンスアニメーション
  useEffect(() => {
    if (!isLoading && variant !== "scroll") return;

    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    bounce.start();

    return () => bounce.stop();
  }, [isLoading, variant, bounceAnim]);

  // 揺れアニメーション（スクロール時）
  useEffect(() => {
    if (variant !== "scroll" || !hasNextPage) return;

    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );

    wiggle.start();

    return () => wiggle.stop();
  }, [variant, hasNextPage, rotateAnim]);

  // まばたき
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // メッセージ切り替え（ローディング中のみ）
  useEffect(() => {
    if (!isLoading || message) return;

    const messages = variant === "scroll" ? SCROLL_MESSAGES : LOADING_MESSAGES;
    const messageInterval = setInterval(() => {
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [isLoading, message, variant]);

  // 表示判定
  if (variant === "loading" && !isLoading) return null;
  if (variant === "scroll" && !hasNextPage) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-5deg", "0deg", "5deg"],
  });

  // 画像選択
  const getImage = () => {
    if (isBlinking) return LINK_IMAGES.blink;
    if (variant === "scroll") return LINK_IMAGES.smile;
    return LINK_IMAGES.normal;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.characterContainer,
          {
            transform: [
              { translateY: bounceAnim },
              { rotate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Image
          source={getImage()}
          style={{ width: config.image, height: config.image }}
          contentFit="contain"
        />
      </Animated.View>
      
      <View style={styles.messageContainer}>
        <Text style={[styles.message, { fontSize: config.fontSize }]}>
          {message || currentMessage}
        </Text>
        
        {/* ローディング中のドットアニメーション */}
        {isLoading && (
          <LoadingDots />
        )}
      </View>
    </View>
  );
}

// ローディングドットアニメーション
function LoadingDots() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "・"));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.dots}>{dots}</Text>
  );
}

/**
 * スクロール促進用のキャラクター表示
 * 「もっと見る」を可愛く表示
 */
export function ScrollMoreIndicator({
  hasNextPage,
  isFetching,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
}) {
  if (isFetching) {
    return (
      <CharacterLoadingIndicator
        isLoading={true}
        variant="loading"
        size="medium"
      />
    );
  }

  if (hasNextPage) {
    return (
      <CharacterLoadingIndicator
        hasNextPage={true}
        variant="scroll"
        size="small"
        message="↓ もっと見る ↓"
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  characterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: color.textMuted,
    textAlign: "center",
  },
  dots: {
    color: color.accentPrimary,
    fontSize: 14,
    width: 30,
  },
});
