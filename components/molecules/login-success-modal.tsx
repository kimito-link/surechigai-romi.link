import { MaterialIcons } from "@expo/vector-icons";
import { color, palette } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useEffect, useState, useCallback } from "react";
import { Animated, Modal, Text, Pressable, View, Easing, Platform } from "react-native";
import * as Haptics from "expo-haptics";

// キャラクター画像のURL
const CHARACTER_IMAGES = {
  rinku: "https://pbs.twimg.com/profile_images/1919057498083651584/rFPjWJiD_400x400.jpg",
  rinkuIdol: "https://pbs.twimg.com/media/GrPNmKMbYAA0jyU?format=png&name=small",
  konta: "https://pbs.twimg.com/profile_images/1919057498083651584/rFPjWJiD_400x400.jpg",
  tanune: "https://pbs.twimg.com/profile_images/1919057498083651584/rFPjWJiD_400x400.jpg",
};

// ログイン成功時のメッセージパターン
const SUCCESS_PATTERNS = [
  {
    id: "welcome",
    character: CHARACTER_IMAGES.rinkuIdol,
    title: "ログイン成功！🎉",
    message: "おかえりなさい！\n一緒に推しの夢を叶えよう！",
    emoji: "✨",
    gradient: [color.accentPrimary, color.accentAlt] as [string, string],
  },
  {
    id: "excited",
    character: CHARACTER_IMAGES.rinkuIdol,
    title: "やったー！🎊",
    message: "ログインありがとう！\nあなたの参加を待ってたよ！",
    emoji: "🌟",
    gradient: [color.warning, color.accentPrimary] as [string, string],
  },
  {
    id: "happy",
    character: CHARACTER_IMAGES.rinkuIdol,
    title: "ようこそ！😊",
    message: "動員ちゃれんじへようこそ！\nみんなで盛り上げていこう！",
    emoji: "💖",
    gradient: [color.accentAlt, color.cyan500] as [string, string],
  },
  {
    id: "cheer",
    character: CHARACTER_IMAGES.rinkuIdol,
    title: "準備OK！💪",
    message: "さあ、推しを応援する\n準備はできた？",
    emoji: "🔥",
    gradient: [color.danger, color.warning] as [string, string],
  },
];

interface LoginSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userProfileImage?: string;
}

export function LoginSuccessModal({
  visible,
  onClose,
  userName,
  userProfileImage,
}: LoginSuccessModalProps) {
  const [pattern] = useState(() => 
    SUCCESS_PATTERNS[Math.floor(Math.random() * SUCCESS_PATTERNS.length)]
  );
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [confettiAnim] = useState(new Animated.Value(0));

  const handleClose = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [fadeAnim, onClose, scaleAnim]);

  useEffect(() => {
    if (visible) {
      // アニメーションシーケンス
      Animated.sequence([
        // フェードイン
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // スケールアップ
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // 紙吹雪アニメーション
      Animated.loop(
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 3秒後に自動で閉じる
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [confettiAnim, fadeAnim, handleClose, scaleAnim, visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: palette.black + "B3",
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeAnim,
        }}
      >
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleClose}
        />

        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: "85%",
            maxWidth: 340,
          }}
        >
          {/* メインカード */}
          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            {/* グラデーションヘッダー */}
            <LinearGradient
              colors={pattern.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 24,
                paddingHorizontal: 20,
                alignItems: "center",
              }}
            >
              {/* 紙吹雪エフェクト */}
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${(i * 8) + 4}%`,
                      top: -20,
                      transform: [
                        {
                          translateY: confettiAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
                          }),
                        },
                        {
                          rotate: confettiAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", `${360 + i * 30}deg`],
                          }),
                        },
                      ],
                      opacity: confettiAnim.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [1, 1, 0],
                      }),
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {["✨", "🎉", "⭐", "💖", "🌟", "🎊"][i % 6]}
                    </Text>
                  </Animated.View>
                ))}
              </View>

              {/* キャラクターとユーザーアイコン */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                {/* キャラクター */}
                <Image
                  source={{ uri: pattern.character }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 3,
                    borderColor: color.textWhite,
                  }}
                />
                
                {/* ハートアイコン */}
                <View
                  style={{
                    marginHorizontal: 8,
                    backgroundColor: palette.white + "33",
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <MaterialIcons name="favorite" size={24} color={color.textWhite} />
                </View>

                {/* ユーザーアイコン */}
                {userProfileImage ? (
                  <Image
                    source={{ uri: userProfileImage }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 3,
                      borderColor: color.textWhite,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: palette.white + "33",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: color.textWhite,
                    }}
                  >
                    <MaterialIcons name="person" size={40} color={color.textWhite} />
                  </View>
                )}
              </View>

              {/* タイトル */}
              <Text
                style={{
                  color: color.textWhite,
                  fontSize: 24,
                  fontWeight: "bold",
                  textAlign: "center",
                  textShadowColor: palette.black + "4D",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {pattern.title}
              </Text>
            </LinearGradient>

            {/* メッセージ部分 */}
            <View style={{ padding: 24, alignItems: "center" }}>
              {/* ユーザー名 */}
              {userName && (
                <Text
                  style={{
                    color: color.accentPrimary,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 8,
                  }}
                >
                  {userName}さん
                </Text>
              )}

              {/* メッセージ */}
              <Text
                style={{
                  color: color.textPrimary,
                  fontSize: 16,
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 20,
                }}
              >
                {pattern.message}
              </Text>

              {/* 閉じるボタン */}
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 24,
                    backgroundColor: color.border,
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={{ color: color.textMuted, fontSize: 14 }}>
                  タップして始める
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={color.textMuted} style={{ marginLeft: 8 }} />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
