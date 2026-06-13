// components/organisms/tutorial-overlay/TutorialOverlay.tsx
// v6.18: リファクタリング済みチュートリアルオーバーレイ
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

/**
 * 強化版チュートリアルオーバーレイ
 */
export function TutorialOverlay({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onComplete,
  visible,
}: TutorialOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<CharacterKey>("rinku_normal");
  
  // アニメーション値
  const messageOpacity = useSharedValue(0);
  const characterBounce = useSharedValue(0);
  const characterScale = useSharedValue(1);
  const previewScale = useSharedValue(0);
  const speechBubbleScale = useSharedValue(0);

  // 表情変化のタイマー
  useEffect(() => {
    if (!visible) return;
    
    const baseChar = step.character || "rinku_normal";
    setCurrentExpression(baseChar);
    
    // まばたきアニメーション
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
    transform: [
      { translateY: characterBounce.value },
      { scale: characterScale.value },
    ],
  }));

  const previewStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
    opacity: previewScale.value,
  }));

  const speechBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speechBubbleScale.value }],
    opacity: speechBubbleScale.value,
  }));

  const handleTap = () => {
    if (step.tapToContinue !== false) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const charBase = (step.character || "rinku_normal").split("_")[0];
      setCurrentExpression(`${charBase}_smile` as CharacterKey);
      characterScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      setTimeout(() => {
        if (stepNumber >= totalSteps) {
          onComplete();
        } else {
          onNext();
        }
      }, 200);
    }
  };

  if (!visible) return null;

  const characterSource = CHARACTER_IMAGES[currentExpression] || CHARACTER_IMAGES.rinku_normal;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container]}
    >
      <Pressable
        
        onPress={handleTap}
        style={styles.overlay}
      >
        <View style={styles.darkOverlay} />

        <Confetti active={showConfetti} />
        <Sparkles active={showSparkles} />

        <Animated.View style={[styles.contentContainer, messageStyle]}>
          {step.previewType && step.previewType !== "none" && (
            <Animated.View style={[styles.previewContainer, previewStyle]}>
              <PreviewComponent type={step.previewType} />
            </Animated.View>
          )}

          <View style={styles.characterSection}>
            <Animated.View style={[styles.characterContainer, characterStyle]}>
              <Image
                source={characterSource}
                style={styles.characterImage}
                contentFit="contain"
              />
            </Animated.View>
            
            {step.speech && (
              <Animated.View style={[styles.speechBubble, speechBubbleStyle]}>
                <Text style={styles.speechText}>{step.speech}</Text>
                <View style={styles.speechTail} />
              </Animated.View>
            )}
          </View>

          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{step.message}</Text>
            {step.subMessage && (
              <Text style={styles.subMessageText}>{step.subMessage}</Text>
            )}
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

          <View style={styles.characterNavigation}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
              }}
              disabled={stepNumber <= 1}
              style={[
                styles.characterNavButton,
                stepNumber <= 1 && styles.characterNavButtonDisabled
              ]}
              
            >
              <Image
                source={CHARACTER_IMAGES.konta_normal}
                style={styles.navCharacterImage}
                contentFit="contain"
              />
              <View style={[
                styles.navBubble,
                styles.navBubbleLeft,
                stepNumber <= 1 && styles.navBubbleDisabled
              ]}>
                <View style={styles.navBubbleTailLeft} />
                <Text style={[
                  styles.navBubbleText,
                  stepNumber <= 1 && styles.navBubbleTextDisabled
                ]}>← 戻る</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleTap();
              }}
              style={styles.characterNavButton}
              
            >
              <View style={[styles.navBubble, styles.navBubbleRight, styles.navBubblePrimary]}>
                <Text style={styles.navBubbleTextPrimary}>
                  {stepNumber >= totalSteps ? "完了 ✓" : "次へ →"}
                </Text>
                <View style={styles.navBubbleTailRight} />
              </View>
              <Image
                source={CHARACTER_IMAGES.tanune_normal}
                style={styles.navCharacterImage}
                contentFit="contain"
              />
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
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.black + "EB", // 92% opacity
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    maxWidth: 400,
  },
  previewContainer: {
    marginBottom: 20,
  },
  characterSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  characterContainer: {
    marginRight: 8,
  },
  characterImage: {
    width: 120,
    height: 120,
  },
  speechBubble: {
    backgroundColor: color.textWhite,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: 180,
    position: "relative",
  },
  speechText: {
    color: color.tutorialText,
    fontSize: 13,
    lineHeight: 18,
  },
  speechTail: {
    position: "absolute",
    left: -8,
    bottom: 15,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderRightWidth: 10,
    borderRightColor: color.textWhite,
  },
  messageBubble: {
    backgroundColor: color.hostAccentLegacy,
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: color.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageText: {
    color: color.textWhite,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 32,
  },
  subMessageText: {
    color: palette.white + "E6", // 90% opacity
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    marginTop: 24,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.white + "4D", // 30% opacity
  },
  stepDotActive: {
    backgroundColor: color.hostAccentLegacy,
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: color.success,
  },
  characterNavigation: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 24,
    gap: 40,
  },
  characterNavButton: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  characterNavButtonDisabled: {
    opacity: 0.4,
  },
  navCharacterImage: {
    width: 48,
    height: 48,
  },
  navBubble: {
    backgroundColor: palette.white + "26", // 15% opacity
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: "relative",
    marginBottom: 8,
  },
  navBubbleLeft: {
    marginLeft: -8,
  },
  navBubbleRight: {
    marginRight: -8,
  },
  navBubbleDisabled: {
    backgroundColor: palette.white + "14", // 8% opacity
  },
  navBubblePrimary: {
    backgroundColor: color.hotPink,
  },
  navBubbleTailLeft: {
    position: "absolute",
    left: -6,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderTopColor: "transparent",
    borderBottomWidth: 5,
    borderBottomColor: "transparent",
    borderRightWidth: 6,
    borderRightColor: palette.white + "26", // 15% opacity
  },
  navBubbleTailRight: {
    position: "absolute",
    right: -6,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderTopColor: "transparent",
    borderBottomWidth: 5,
    borderBottomColor: "transparent",
    borderLeftWidth: 6,
    borderLeftColor: color.hotPink,
  },
  navBubbleText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "600",
  },
  navBubbleTextDisabled: {
    color: palette.white + "66", // 40% opacity
  },
  navBubbleTextPrimary: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
});
