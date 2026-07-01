/**
 * OnboardingSlide — midnight signal テーマ（DESIGN.md 準拠）
 */

import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import type { OnboardingSlide as SlideType, OnboardingSlideAccent } from "../constants";
import { palette } from "@/theme/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const characterImages = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

const logoImage = require("@/assets/images/logos/kimitolink-logo.jpg");
const idolRinku = require("@/assets/images/characters/idolKimitoLink.png");

const ACCENT: Record<OnboardingSlideAccent, string> = {
  pink: palette.primary500,
  purple: palette.accent500,
  teal: palette.teal500,
  signal: palette.kimitoBlue,
};

interface OnboardingSlideProps {
  slide: SlideType;
  isActive: boolean;
}

function SignalGlow({ accent }: { accent: OnboardingSlideAccent }) {
  const color = ACCENT[accent];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.glowOrb, styles.glowOrbA, { backgroundColor: color + "22" }]} />
      <View style={[styles.glowOrb, styles.glowOrbB, { backgroundColor: color + "14" }]} />
      {Array.from({ length: 18 }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 17 + 7) % 100}%`,
            top: `${(i * 23 + 11) % 88}%`,
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            borderRadius: 2,
            backgroundColor: i % 4 === 0 ? color : "#FFFFFF",
            opacity: 0.15 + (i % 5) * 0.08,
          }}
        />
      ))}
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
          <Image source={characterImages.rinku} style={styles.mainCharacter} contentFit="contain" />
          <Image source={characterImages.tanune} style={styles.sideCharacter} contentFit="contain" />
        </View>
      );
    }
    if (slide.characterType === "rinku") {
      return (
        <View style={styles.singleCharacterContainer}>
          <Image source={idolRinku} style={styles.idolCharacter} contentFit="contain" />
        </View>
      );
    }
    const src =
      slide.characterType === "konta" ? characterImages.konta : characterImages.tanune;
    return (
      <View style={styles.singleCharacterContainer}>
        <Image source={src} style={styles.largeCharacter} contentFit="contain" />
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

      <Animated.View entering={FadeIn.delay(80).duration(320)} style={[styles.chip, { borderColor: accent + "66" }]}>
        <View style={[styles.chipDot, { backgroundColor: accent }]} />
        <Text style={[styles.chipText, { color: accent }]}>{slide.chip}</Text>
      </Animated.View>

      {slide.showLogo ? (
        <Animated.View entering={FadeIn.delay(120).duration(320)} style={styles.logoContainer}>
          <Image source={logoImage} style={styles.logo} contentFit="contain" />
        </Animated.View>
      ) : null}

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
    backgroundColor: "#0a0a0a",
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
    backgroundColor: "rgba(255,255,255,0.04)",
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
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 160,
    height: 52,
    borderRadius: 8,
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
  mainCharacter: {
    width: 76,
    height: 76,
    marginHorizontal: 6,
  },
  sideCharacter: {
    width: 56,
    height: 56,
  },
  largeCharacter: {
    width: 96,
    height: 96,
  },
  idolCharacter: {
    width: 110,
    height: 160,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#F5F5F5",
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
    color: "rgba(245,245,245,0.88)",
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
    backgroundColor: "rgba(255,255,255,0.05)",
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
    color: "#E5E5E5",
    flex: 1,
    lineHeight: 20,
  },
});
