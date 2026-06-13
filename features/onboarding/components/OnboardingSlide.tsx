/**
 * OnboardingSlide Component
 * v6.31: 宇宙テーマとキャラクター対応
 */

import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import type { OnboardingSlide as SlideType } from "../constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// キャラクター画像
const characterImages = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

// ロゴ画像
const logoImage = require("@/assets/images/logos/kimitolink-logo.jpg");

// アイドル版りんくちゃん
const idolRinku = require("@/assets/images/characters/idolKimitoLink.png");

interface OnboardingSlideProps {
  slide: SlideType;
  isActive: boolean;
}

// 星を生成するコンポーネント
function Stars() {
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.3,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star) => (
        <View
          key={star.id}
          style={{
            position: "absolute",
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: "#FFFFFF",
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
}

export function OnboardingSlide({ slide, isActive }: OnboardingSlideProps) {
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
    } else if (slide.characterType === "rinku") {
      return (
        <View style={styles.singleCharacterContainer}>
          <Image source={idolRinku} style={styles.idolCharacter} contentFit="contain" />
        </View>
      );
    } else if (slide.characterType === "konta") {
      return (
        <View style={styles.singleCharacterContainer}>
          <Image source={characterImages.konta} style={styles.largeCharacter} contentFit="contain" />
        </View>
      );
    } else if (slide.characterType === "tanune") {
      return (
        <View style={styles.singleCharacterContainer}>
          <Image source={characterImages.tanune} style={styles.largeCharacter} contentFit="contain" />
        </View>
      );
    }
    return null;
  };
  
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={[styles.container, { backgroundColor: slide.backgroundColor }]}
    >
      {/* 星空背景 */}
      <Stars />
      
      {/* ロゴ（showLogoがtrueの場合） */}
      {slide.showLogo && (
        <Animated.View 
          entering={FadeIn.delay(100).duration(400)}
          style={styles.logoContainer}
        >
          <Image source={logoImage} style={styles.logo} contentFit="contain" />
        </Animated.View>
      )}
      
      {/* キャラクター */}
      <Animated.View 
        entering={FadeIn.delay(200).duration(400)}
        style={styles.characterWrapper}
      >
        {renderCharacters()}
      </Animated.View>
      
      {/* Title */}
      <Animated.View entering={FadeIn.delay(300).duration(400)}>
        <Text style={styles.title}>{slide.title}</Text>
      </Animated.View>
      
      {/* Description */}
      <Animated.View entering={FadeIn.delay(400).duration(400)}>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>
      
      {/* Features */}
      {slide.features && (
        <Animated.View 
          entering={FadeIn.delay(500).duration(400)}
          style={styles.featuresContainer}
        >
          {slide.features.map((feature, index) => (
            <Animated.View 
              key={index}
              entering={FadeIn.delay(600 + index * 100).duration(300)}
              style={styles.featureItem}
            >
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 60,
    borderRadius: 8,
  },
  characterWrapper: {
    marginBottom: 24,
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
    width: 80,
    height: 80,
    marginHorizontal: 8,
  },
  sideCharacter: {
    width: 60,
    height: 60,
  },
  largeCharacter: {
    width: 100,
    height: 100,
  },
  idolCharacter: {
    width: 120,
    height: 180,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 32,
  },
  featuresContainer: {
    width: "100%",
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.3)",
  },
  featureBullet: {
    fontSize: 16,
    color: "#FFA500",
    marginRight: 12,
    fontWeight: "bold",
  },
  featureText: {
    fontSize: 15,
    color: "#FFFFFF",
    flex: 1,
  },
});
