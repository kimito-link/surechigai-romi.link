/**
 * OnboardingScreen Component
 * v6.33: 画面タップで次へ進む機能を追加（チュートリアルと同じUX）
 */

import { View, StyleSheet, StatusBar, Platform, Pressable } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../hooks/useOnboarding";
import { ONBOARDING_SLIDES } from "../constants";
import { OnboardingSlide } from "./OnboardingSlide";
import { OnboardingNavigation } from "./OnboardingNavigation";
import { APP_VERSION } from "@/shared/version";
import { Text } from "react-native";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const {
    currentSlideIndex,
    isLastSlide,
    isFirstSlide,
    totalSlides,
    goToNextSlide,
    goToPrevSlide,
    goToSlide,
    completeOnboarding,
  } = useOnboarding();
  
  const translateX = useSharedValue(0);
  
  const handleComplete = async () => {
    await completeOnboarding();
    onComplete();
  };
  
  const handleSkip = async () => {
    await completeOnboarding();
    onComplete();
  };
  
  // 画面タップで次へ進む（チュートリアルと同じUX）
  const handleScreenTap = () => {
    // ハプティックフィードバック
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isLastSlide) {
      handleComplete();
    } else {
      goToNextSlide();
    }
  };
  
  // スワイプジェスチャー
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = 50;
      
      if (event.translationX < -threshold && !isLastSlide) {
        runOnJS(goToNextSlide)();
      } else if (event.translationX > threshold && !isFirstSlide) {
        runOnJS(goToPrevSlide)();
      }
      
      translateX.value = withTiming(0, { duration: 200 });
    });
  
  // タップジェスチャー
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(handleScreenTap)();
    });
  
  // スワイプとタップを組み合わせ
  const composedGesture = Gesture.Race(panGesture, tapGesture);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }],
  }));
  
  const currentSlide = ONBOARDING_SLIDES[currentSlideIndex];
  
  return (
    <View style={[styles.container, { backgroundColor: "#0a1628" }]}>
      <StatusBar barStyle="light-content" />
      
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.slideContainer, animatedStyle]}>
          {ONBOARDING_SLIDES.map((slide, index) => (
            <OnboardingSlide
              key={slide.id}
              slide={slide}
              isActive={index === currentSlideIndex}
            />
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
      
      {/* バージョン表示 */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
  },
  versionContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
});
