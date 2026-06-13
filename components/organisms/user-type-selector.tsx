import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useEffect } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { UserType } from "@/lib/tutorial-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// キャラクター画像
const characterImages = {
  fan: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
  host: require("@/assets/images/characters/tanunee/tanuki-yukkuri-normal-mouth-open.png"),
  main: require("@/assets/images/characters/KimitoLink.png"),
};

type UserTypeSelectorProps = {
  visible: boolean;
  onSelect: (userType: UserType) => void;
  onSkip: () => void;
};

/**
 * 強化版ユーザータイプ選択画面
 * 
 * - キャラクターのアニメーション
 * - キラキラエフェクト
 * - より魅力的なデザイン
 */
export function UserTypeSelector({ visible, onSelect, onSkip }: UserTypeSelectorProps) {
  // アニメーション値
  const fanScale = useSharedValue(1);
  const hostScale = useSharedValue(1);
  const mainCharacterY = useSharedValue(0);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);
  const sparkle3Opacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      // 静的な表示（ちかちかアニメーション削除）
      mainCharacterY.value = withTiming(0, { duration: 300 });
      sparkle1Opacity.value = withTiming(1, { duration: 300 });
      sparkle2Opacity.value = withTiming(1, { duration: 300 });
      sparkle3Opacity.value = withTiming(1, { duration: 300 });
      titleScale.value = withTiming(1, { duration: 300 });
    }
  }, [visible, mainCharacterY, sparkle1Opacity, sparkle2Opacity, sparkle3Opacity, titleScale]);

  const handlePressIn = (type: UserType) => {
    if (type === "fan") {
      fanScale.value = withSpring(0.95);
    } else {
      hostScale.value = withSpring(0.95);
    }
  };

  const handlePressOut = (type: UserType) => {
    if (type === "fan") {
      fanScale.value = withSpring(1);
    } else {
      hostScale.value = withSpring(1);
    }
  };

  const handleSelect = (type: UserType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect(type);
  };

  const fanStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fanScale.value }],
  }));

  const hostStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hostScale.value }],
  }));

  const mainCharacterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mainCharacterY.value }],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3Opacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <Animated.View entering={SlideInUp.delay(100).springify()} style={styles.content}>
          {/* メインキャラクター */}
          <Animated.View style={[styles.mainCharacterContainer, mainCharacterStyle]}>
            <Image
              source={characterImages.main}
              style={styles.mainCharacterImage}
              contentFit="contain"
            />
            {/* キラキラエフェクト */}
            <Animated.Text style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>✦</Animated.Text>
            <Animated.Text style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>✦</Animated.Text>
            <Animated.Text style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>✦</Animated.Text>
          </Animated.View>

          {/* タイトル */}
          <Animated.View style={titleStyle}>
            <Text style={styles.title}>はじめまして！</Text>
            <Text style={styles.subtitle}>あなたはどっち？</Text>
          </Animated.View>

          {/* 選択肢 */}
          <View style={styles.optionsContainer}>
            {/* ファン */}
            <Animated.View style={fanStyle}>
              <Pressable
                onPressIn={() => handlePressIn("fan")}
                onPressOut={() => handlePressOut("fan")}
                onPress={() => handleSelect("fan")}
                style={[styles.optionCard, { backgroundColor: color.accentPrimary }]}
              >
                <View style={styles.optionImageContainer}>
                  <Image
                    source={characterImages.fan}
                    style={styles.characterImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.optionTitle}>ファン</Text>
                <Text style={styles.optionDescription}>推しを応援したい</Text>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>参加する側</Text>
                </View>
              </Pressable>
            </Animated.View>

            {/* 主催者 */}
            <Animated.View style={hostStyle}>
              <Pressable
                onPressIn={() => handlePressIn("host")}
                onPressOut={() => handlePressOut("host")}
                onPress={() => handleSelect("host")}
                style={[styles.optionCard, { backgroundColor: color.hostAccentLegacy }]}
              >
                <View style={styles.optionImageContainer}>
                  <Image
                    source={characterImages.host}
                    style={styles.characterImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.optionTitle}>主催者</Text>
                <Text style={styles.optionDescription}>チャレンジを作りたい</Text>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>企画する側</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>

          {/* 説明テキスト */}
          <Text style={styles.helpText}>
            どちらを選んでも、あとで両方使えます
          </Text>

          {/* スキップ */}
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.skipText}>あとで見る</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  overlay: {
    flex: 1,
    backgroundColor: palette.gray900 + "EB", // 92% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  mainCharacterContainer: {
    position: "relative",
    marginBottom: 16,
  },
  mainCharacterImage: {
    width: 100,
    height: 100,
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
    color: color.rankGold,
  },
  sparkle1: {
    top: -10,
    right: -15,
  },
  sparkle2: {
    top: 20,
    left: -20,
  },
  sparkle3: {
    bottom: 0,
    right: -20,
  },
  title: {
    color: color.textWhite,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: color.textWhite + "B3", // 70% opacity
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  optionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    maxWidth: 160,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: color.textWhite + "33", // 20% opacity
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  characterImage: {
    width: 60,
    height: 60,
  },
  optionTitle: {
    color: color.textWhite,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  optionDescription: {
    color: color.textWhite + "CC", // 80% opacity
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  optionBadge: {
    backgroundColor: color.textWhite + "33", // 20% opacity
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  optionBadgeText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  helpText: {
    color: color.textWhite + "80", // 50% opacity
    fontSize: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: color.textWhite + "80", // 50% opacity
    fontSize: 14,
  },
});
