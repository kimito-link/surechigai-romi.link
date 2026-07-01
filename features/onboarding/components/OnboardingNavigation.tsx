/**
 * OnboardingNavigation — ドット・戻る/次へ/スキップ
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics } from "@/lib/haptics";
import { color, palette } from "@/theme/tokens";

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
    if (isLastSlide) onComplete();
    else onNext();
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.topRow}>
        {!isLastSlide ? (
          <TouchableOpacity onPress={() => { haptics.lightTap(); onSkip(); }} style={styles.skipButton} accessibilityRole="button" accessibilityLabel="オンボーディングをスキップ">
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      <View style={styles.dotsContainer} accessibilityRole="tablist">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => { haptics.lightTap(); onDotPress(index); }}
            style={[styles.dot, index === currentIndex && styles.dotActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: index === currentIndex }}
            accessibilityLabel={`スライド ${index + 1}`}
          />
        ))}
      </View>

      <View style={styles.buttonsContainer}>
        {!isFirstSlide ? (
          <TouchableOpacity onPress={() => { haptics.lightTap(); onPrev(); }} style={styles.prevButton} accessibilityRole="button">
            <Text style={styles.prevButtonText}>戻る</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.prevButton} />
        )}

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextButton, isLastSlide && styles.completeButton]}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? "はじめる" : "次へ"}
        >
          <Text style={[styles.nextButtonText, isLastSlide && styles.completeButtonText]}>
            {isLastSlide ? "はじめる" : "次へ →"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hintText}>画面タップ / スワイプでも進めます</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(240,244,248,0.96)",
    borderTopWidth: 1,
    borderTopColor: palette.kimitoBorderSoft,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
  },
  skipText: {
    fontSize: 14,
    color: color.textMuted,
    textAlign: "right",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.kimitoBorderSoft,
  },
  dotActive: {
    width: 22,
    backgroundColor: palette.kimitoBlue,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prevButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 88,
  },
  prevButtonText: {
    fontSize: 15,
    color: color.textMuted,
  },
  nextButton: {
    backgroundColor: palette.white,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    minWidth: 128,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.kimitoBlue,
  },
  completeButton: {
    backgroundColor: palette.kimitoBlue,
    borderColor: palette.kimitoBlue,
  },
  completeButtonText: {
    color: palette.white,
  },
  hintText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: color.textHint,
  },
});
