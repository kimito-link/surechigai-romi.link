/**
 * OnboardingSlide — kimito.link ライト UI
 */

import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import type { OnboardingSlide as SlideType, OnboardingSlideAccent } from "../constants";
import { color, palette } from "@/theme/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const characterImages = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

const ACCENT: Record<OnboardingSlideAccent, string> = {
  pink: palette.kimitoOrange,
  purple: palette.kimitoPurple,
  teal: palette.teal600,
  signal: palette.kimitoBlue,
};

interface OnboardingSlideProps {
  slide: SlideType;
  isActive: boolean;
}

function SignalGlow({ accent }: { accent: OnboardingSlideAccent }) {
  const accentColor = ACCENT[accent];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.glowOrb, styles.glowOrbA, { backgroundColor: accentColor + "18" }]} />
      <View style={[styles.glowOrb, styles.glowOrbB, { backgroundColor: accentColor + "10" }]} />
    </View>
  );
}

export function OnboardingSlide({ slide, isActive }: OnboardingSlideProps) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const accent = ACCENT[slide.accent];

  if (!isActive) return null;

  const renderCharacters = () => {
    if (slide.characterType === "all") {
      return (
        <View style={styles.allCharactersContainer}>
          <Image source={characterImages.konta} style={styles.sideCharacter} contentFit="contain" />
          <Image source={characterImages.rinku} style={styles.heroCharacter} contentFit="contain" />
          <Image source={characterImages.tanune} style={styles.sideCharacter} contentFit="contain" />
        </View>
      );
    }

    const isRinku = slide.characterType === "rinku";
    const src = isRinku
      ? characterImages.rinku
      : slide.characterType === "konta"
        ? characterImages.konta
        : characterImages.tanune;

    return (
      <View style={styles.singleCharacterContainer}>
        <Image
          source={src}
          style={isRinku ? styles.heroCharacter : styles.largeCharacter}
          contentFit="contain"
        />
      </View>
    );
  };

  return (
    <Animated.View
      entering={SlideInRight.duration(280)}
      exiting={SlideOutLeft.duration(220)}
      style={[styles.container, { width: SCREEN_WIDTH }]}
    >
      <SignalGlow accent={slide.accent} />

      <Animated.View entering={FadeIn.delay(80).duration(320)} style={[styles.chip, { borderColor: accent + "44" }]}>
        <View style={[styles.chipDot, { backgroundColor: accent }]} />
        <Text style={[styles.chipText, { color: accent }]}>{slide.chip}</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(160).duration(320)} style={styles.characterWrapper}>
        {renderCharacters()}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(220).duration(320)}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{slide.title}</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(280).duration(320)}>
        <Text style={[styles.description, compact && styles.descriptionCompact]}>{slide.description}</Text>
      </Animated.View>

      {slide.features ? (
        <Animated.View entering={FadeIn.delay(340).duration(320)} style={styles.featuresContainer}>
          {slide.features.map((feature, index) => (
            <Animated.View
              key={feature}
              entering={FadeIn.delay(380 + index * 70).duration(260)}
              style={[styles.featureItem, { borderColor: accent + "33" }]}
            >
              <Text style={[styles.featureBullet, { color: accent }]}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 148,
    backgroundColor: palette.kimitoBg,
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  glowOrbA: {
    width: 280,
    height: 280,
    top: "8%",
    right: "-20%",
  },
  glowOrbB: {
    width: 220,
    height: 220,
    bottom: "18%",
    left: "-18%",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: palette.kimitoBlueSoft,
    marginBottom: 16,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  characterWrapper: {
    marginBottom: 20,
  },
  allCharactersContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  singleCharacterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  sideCharacter: {
    width: 56,
    height: 56,
  },
  largeCharacter: {
    width: 96,
    height: 96,
  },
  heroCharacter: {
    width: 168,
    height: 168,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: palette.kimitoBlue,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 38,
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: color.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 24,
  },
  descriptionCompact: {
    fontSize: 15,
    lineHeight: 24,
  },
  featuresContainer: {
    width: "100%",
    maxWidth: 340,
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: palette.white,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  featureBullet: {
    fontSize: 14,
    marginRight: 10,
    fontWeight: "800",
    marginTop: 1,
  },
  featureText: {
    fontSize: 14,
    color: color.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
});
