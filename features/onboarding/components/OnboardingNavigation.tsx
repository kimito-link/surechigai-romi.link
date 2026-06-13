/**
 * OnboardingNavigation Component
 * オンボーディングのナビゲーション（ドット、ボタン）
 */

import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics } from "@/lib/haptics";

interface OnboardingNavigationProps {
  currentIndex: number;
  totalSlides: number;
  isLastSlide: boolean;
  isFirstSlide: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onDotPress: (index: number) => void;
}

export function OnboardingNavigation({
  currentIndex,
  totalSlides,
  isLastSlide,
  isFirstSlide,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onDotPress,
}: OnboardingNavigationProps) {
  const insets = useSafeAreaInsets();
  
  const handleNext = () => {
    haptics.lightTap();
    if (isLastSlide) {
      onComplete();
    } else {
      onNext();
    }
  };
  
  const handlePrev = () => {
    haptics.lightTap();
    onPrev();
  };
  
  const handleSkip = () => {
    haptics.lightTap();
    onSkip();
  };
  
  const handleDotPress = (index: number) => {
    haptics.lightTap();
    onDotPress(index);
  };
  
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Skip button */}
      <View style={styles.topRow}>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>
      
      {/* Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSlides }).map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleDotPress(index)}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
      
      {/* Navigation buttons */}
      <View style={styles.buttonsContainer}>
        {!isFirstSlide ? (
          <TouchableOpacity onPress={handlePrev} style={styles.prevButton}>
            <Text style={styles.prevButtonText}>戻る</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.prevButton} />
        )}
        
        <TouchableOpacity 
          onPress={handleNext} 
          style={[styles.nextButton, isLastSlide && styles.completeButton]}
        >
          <Text style={[styles.nextButtonText, isLastSlide && styles.completeButtonText]}>
            {isLastSlide ? "始める" : "次へ"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  skipText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FFFFFF",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prevButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
  },
  prevButtonText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  nextButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  completeButton: {
    backgroundColor: "#FFFFFF",
  },
  completeButtonText: {
    color: "#FF6B6B",
  },
});
