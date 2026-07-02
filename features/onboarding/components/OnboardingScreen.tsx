/**
 * OnboardingScreen — スワイプ / タップ / キーボード操作
 */

import { useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, StatusBar, Platform, Text, ActivityIndicator } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../hooks/useOnboarding";
import { OnboardingSlide } from "./OnboardingSlide";
import { OnboardingNavigation } from "./OnboardingNavigation";
import { APP_VERSION } from "@/shared/version";
import { palette, color } from "@/theme/tokens";

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const touchMovedRef = useRef(false);

  const {
    currentSlideIndex,
    isLastSlide,
    isFirstSlide,
    totalSlides,
    visibleSlides,
    goToNextSlide,
    goToPrevSlide,
    goToSlide,
    completeOnboarding,
  } = useOnboarding();

  const translateX = useSharedValue(0);

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    router.push("/(tabs)/checkin" as never);
  }, [completeOnboarding]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  const handleScreenTap = () => {
    if (touchMovedRef.current) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isLastSlide) void handleComplete();
    else goToNextSlide();
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      touchMovedRef.current = false;
    })
    .onUpdate((event) => {
      if (Math.abs(event.translationX) > 8) touchMovedRef.current = true;
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = 50;
      if (event.translationX < -threshold && !isLastSlide) runOnJS(goToNextSlide)();
      else if (event.translationX > threshold && !isFirstSlide) runOnJS(goToPrevSlide)();
      translateX.value = withTiming(0, { duration: 200 });
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleScreenTap)();
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.25 }],
  }));

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLastSlide) void handleComplete();
        else goToNextSlide();
      } else if (e.key === "ArrowLeft" && !isFirstSlide) {
        goToPrevSlide();
      } else if (e.key === "Escape") {
        void handleSkip();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLastSlide, isFirstSlide, goToNextSlide, goToPrevSlide, handleComplete, handleSkip]);

  return (
    <View
      style={styles.container}
      accessibilityViewIsModal
      accessibilityLabel="君斗りんくのすれ違ひ通信 初回ガイド"
    >
      <StatusBar barStyle="dark-content" />

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.slideContainer, animatedStyle]}>
          {visibleSlides.map((slide, index) => (
            <OnboardingSlide key={slide.id} slide={slide} isActive={index === currentSlideIndex} />
          ))}
        </Animated.View>
      </GestureDetector>

      <OnboardingNavigation
        currentIndex={currentSlideIndex}
        totalSlides={totalSlides}
        isLastSlide={isLastSlide}
        isFirstSlide={isFirstSlide}
        onNext={goToNextSlide}
        onPrev={goToPrevSlide}
        onSkip={handleSkip}
        onComplete={handleComplete}
        onDotPress={goToSlide}
      />

      <View style={[styles.versionContainer, { top: Math.max(insets.top, 12) + 4 }]}>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
}

/** 永続化状態読み込み中 */
export function OnboardingBootSplash() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ActivityIndicator size="large" color={palette.kimitoBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.kimitoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  slideContainer: {
    flex: 1,
  },
  versionContainer: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  versionText: {
    color: color.textHint,
    fontSize: 11,
    fontWeight: "600",
  },
});
