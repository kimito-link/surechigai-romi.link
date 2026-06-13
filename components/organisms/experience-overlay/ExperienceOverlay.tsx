/**
 * experience-overlay/ExperienceOverlay.tsx
 * 
 * 経験値オーバーレイのメインコンポーネント
 * v6.34: 画面全体を覆うように修正
 */
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useExperience } from "@/lib/experience-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CHARACTER_IMAGES } from "./constants";
import { PreviewContent } from "./preview-content";
import { styles } from "./ExperienceOverlay.styles";

export function ExperienceOverlay() {
  const { 
    isActive, 
    currentSlide, 
    currentSlideIndex, 
    totalSlides, 
    nextSlide, 
    prevSlide, 
    endExperience,
    experienceType,
  } = useExperience();
  const insets = useSafeAreaInsets();

  if (!isActive || !currentSlide) {
    return null;
  }

  const characterImage = CHARACTER_IMAGES[currentSlide.character];
  const isLastSlide = currentSlideIndex === totalSlides - 1;
  const title = experienceType === "organizer" ? "主催者の追体験" : "ファンの追体験";

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[
        localStyles.fullScreenOverlay,
        { 
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: currentSlide.backgroundColor || color.overlayDark,
        }
      ]}
    >
      {/* タップで次へ進む（画面全体） */}
      <Pressable
        onPress={nextSlide}
        style={localStyles.tapArea}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            {currentSlide.stepTitle && (
              <Text style={styles.stepTitle}>
                {currentSlide.stepNumber !== undefined && currentSlide.stepNumber > 0 
                  ? `STEP ${currentSlide.stepNumber}: ${currentSlide.stepTitle}`
                  : currentSlide.stepTitle
                }
              </Text>
            )}
          </View>
          <Pressable 
            onPress={(e) => {
              e.stopPropagation();
              endExperience();
            }}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }
            ]}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {/* プログレスバー（ステップ表示） */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarWrapper}>
            <View 
              style={[
                styles.progressBarFillHeader, 
                { width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{currentSlideIndex + 1} / {totalSlides}</Text>
        </View>

        {/* コンテンツ */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            key={currentSlide.id}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.content}
          >
            {/* キャラクターと心理描写の吹き出し */}
            <View style={styles.characterSection}>
              <View style={styles.characterContainer}>
                <Image
                  source={characterImage}
                  style={styles.characterImage}
                  contentFit="contain"
                />
              </View>
              
              {/* 心理描写の吹き出し */}
              {currentSlide.thought && (
                <View style={styles.thoughtBubble}>
                  <View style={styles.thoughtTail} />
                  <Text style={styles.thoughtText}>{currentSlide.thought}</Text>
                </View>
              )}
            </View>

            {/* メインメッセージ */}
            <View style={styles.speechBubble}>
              <Text style={styles.messageText}>{currentSlide.message}</Text>
            </View>

            {/* サブメッセージ */}
            {currentSlide.subMessage && (
              <Text style={styles.subMessageText}>{currentSlide.subMessage}</Text>
            )}

            {/* プレビュー */}
            {currentSlide.previewType && currentSlide.previewType !== "none" && (
              <PreviewContent type={currentSlide.previewType} />
            )}
          </Animated.View>

          {/* ナビゲーションボタン（コンテンツの下に配置） */}
          <View style={styles.navigation}>
            {/* こん太（戻るボタン） */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              disabled={currentSlideIndex === 0}
              style={({ pressed }) => [
                styles.characterNavButton,
                currentSlideIndex === 0 && styles.characterNavButtonDisabled,
                pressed && { transform: [{ scale: 0.95 }] }
              ]}
            >
              <Image
                source={CHARACTER_IMAGES.konta}
                style={styles.navCharacterImage}
                contentFit="contain"
              />
              <View style={[
                styles.navBubble,
                styles.navBubbleLeft,
                currentSlideIndex === 0 && styles.navBubbleDisabled
              ]}>
                <View style={styles.navBubbleTailLeft} />
                <Text style={[
                  styles.navBubbleText,
                  currentSlideIndex === 0 && styles.navBubbleTextDisabled
                ]}>← 戻る</Text>
              </View>
            </Pressable>

            {/* たぬ姉（次へボタン） */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              style={({ pressed }) => [
                styles.characterNavButton,
                pressed && { transform: [{ scale: 0.95 }] }
              ]}
            >
              <View style={[styles.navBubble, styles.navBubbleRight, styles.navBubblePrimary]}>
                <Text style={styles.navBubbleTextPrimary}>
                  {isLastSlide ? "完了 ✓" : "次へ →"}
                </Text>
                <View style={styles.navBubbleTailRight} />
              </View>
              <Image
                source={CHARACTER_IMAGES.tanune}
                style={styles.navCharacterImage}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  tapArea: {
    flex: 1,
  },
});
