// components/organisms/tutorial-overlay/TutorialOverlay.tsx
// 君斗りんく — ライト kimito UI チュートリアル
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { color, palette } from "@/theme/tokens";

import { CHARACTER_IMAGES, type CharacterKey, type TutorialOverlayProps } from "./types";
import { Confetti, Sparkles } from "./effects";
import { PreviewComponent } from "./previews";

export function TutorialOverlay({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onComplete,
  onSkip,
  visible,
}: TutorialOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<CharacterKey>("rinku_normal");

  const messageOpacity = useSharedValue(0);
  const characterBounce = useSharedValue(0);
  const characterScale = useSharedValue(1);
  const previewScale = useSharedValue(0);
  const speechBubbleScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    const baseChar = step.character || "rinku_normal";
    setCurrentExpression(baseChar);

    const blinkInterval = setInterval(() => {
      const charBase = baseChar.split("_")[0];
      setCurrentExpression(`${charBase}_blink` as CharacterKey);
      setTimeout(() => {
        setCurrentExpression(baseChar);
      }, 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [visible, step.character]);

  useEffect(() => {
    if (visible) {
      messageOpacity.value = withTiming(1, { duration: 300 });
      characterBounce.value = 0;
      previewScale.value = withDelay(200, withSpring(1, { damping: 12 }));

      if (step.speech) {
        speechBubbleScale.value = withDelay(400, withSpring(1, { damping: 10 }));
      }

      if (step.successAnimation === "confetti") {
        setTimeout(() => setShowConfetti(true), 300);
      } else if (step.successAnimation === "sparkle") {
        setShowSparkles(true);
      }
    } else {
      previewScale.value = 0;
      speechBubbleScale.value = 0;
      setShowConfetti(false);
      setShowSparkles(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const characterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: characterBounce.value }, { scale: characterScale.value }],
  }));

  const previewStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
    opacity: previewScale.value,
  }));

  const speechBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speechBubbleScale.value }],
    opacity: speechBubbleScale.value,
  }));

  const advance = () => {
    if (stepNumber >= totalSteps) {
      onComplete();
    } else {
      onNext();
    }
  };

  const handleTap = () => {
    if (step.tapToContinue === false) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const charBase = (step.character || "rinku_normal").split("_")[0];
    setCurrentExpression(`${charBase}_smile` as CharacterKey);
    characterScale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );

    setTimeout(advance, 200);
  };

  if (!visible) return null;

  const characterSource = CHARACTER_IMAGES[currentExpression] || CHARACTER_IMAGES.rinku_normal;
  const canGoBack = stepNumber > 1;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <Pressable onPress={handleTap} style={styles.overlay}>
        <View style={styles.lightScrim} />

        {onSkip ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="チュートリアルをスキップ"
          >
            <Text style={styles.skipText}>スキップ</Text>
          </Pressable>
        ) : null}

        <Confetti active={showConfetti} />
        <Sparkles active={showSparkles} />

        <Animated.View style={[styles.card, messageStyle]}>
          {step.previewType && step.previewType !== "none" ? (
            <Animated.View style={[styles.previewContainer, previewStyle]}>
              <PreviewComponent type={step.previewType} />
            </Animated.View>
          ) : null}

          <View style={styles.characterSection}>
            <Animated.View style={[styles.characterContainer, characterStyle]}>
              <Image source={characterSource} style={styles.characterImage} contentFit="contain" />
            </Animated.View>

            {step.speech ? (
              <Animated.View style={[styles.speechBubble, speechBubbleStyle]}>
                <Text style={styles.speechText}>{step.speech}</Text>
                <View style={styles.speechTail} />
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.messageSection}>
            <Text style={styles.chip}>STEP {stepNumber}</Text>
            <Text style={styles.messageText}>{step.message}</Text>
            {step.subMessage ? <Text style={styles.subMessageText}>{step.subMessage}</Text> : null}
          </View>

          <View style={styles.stepIndicator}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  i + 1 === stepNumber && styles.stepDotActive,
                  i + 1 < stepNumber && styles.stepDotCompleted,
                ]}
              />
            ))}
          </View>

          <View style={styles.navRow}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (canGoBack) onPrev?.();
              }}
              disabled={!canGoBack}
              style={[styles.navBtn, styles.navBtnSecondary, !canGoBack && styles.navBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="前のステップ"
            >
              <Text style={[styles.navBtnTextSecondary, !canGoBack && styles.navBtnTextDisabled]}>
                ← 戻る
              </Text>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleTap();
              }}
              style={[styles.navBtn, styles.navBtnPrimary]}
              accessibilityRole="button"
              accessibilityLabel={stepNumber >= totalSteps ? "完了" : "次へ"}
            >
              <Text style={styles.navBtnTextPrimary}>
                {stepNumber >= totalSteps ? "完了 ✓" : "次へ →"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  lightScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.kimitoBg + "E6",
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "web" ? 16 : 48,
    right: 16,
    zIndex: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "33",
  },
  skipText: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: palette.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "22",
    shadowColor: palette.kimitoBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  previewContainer: {
    marginBottom: 16,
  },
  characterSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  characterContainer: {
    marginRight: 8,
  },
  characterImage: {
    width: 88,
    height: 88,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: palette.kimitoBlueSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "18",
    position: "relative",
  },
  speechText: {
    color: color.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  speechTail: {
    position: "absolute",
    left: -8,
    bottom: 14,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: "transparent",
    borderBottomWidth: 7,
    borderBottomColor: "transparent",
    borderRightWidth: 9,
    borderRightColor: palette.kimitoBlueSoft,
  },
  messageSection: {
    alignItems: "center",
    marginBottom: 4,
  },
  chip: {
    color: palette.kimitoOrange,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  messageText: {
    color: palette.kimitoBlue,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 32,
  },
  subMessageText: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 320,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.kimitoBlue + "22",
  },
  stepDotActive: {
    backgroundColor: palette.kimitoBlue,
    width: 22,
  },
  stepDotCompleted: {
    backgroundColor: palette.teal600,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  navBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnSecondary: {
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.kimitoBlue,
  },
  navBtnPrimary: {
    backgroundColor: palette.kimitoBlue,
  },
  navBtnDisabled: {
    opacity: 0.35,
    borderColor: color.border,
  },
  navBtnTextSecondary: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "700",
  },
  navBtnTextDisabled: {
    color: color.textMuted,
  },
  navBtnTextPrimary: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
