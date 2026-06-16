import React, { useEffect } from "react";
import { Pressable, StyleSheet, View, Text, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";

export function EnvelopePulse({
  onPress,
  x,
  y,
}: {
  onPress: () => void;
  x: number;
  y: number;
}) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.8);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }
    // Gacha flash sequence
    buttonScale.value = withSequence(
      withTiming(1.5, { duration: 100 }),
      withTiming(0, { duration: 200 })
    );
    setTimeout(onPress, 300);
  };

  return (
    <View style={[styles.container, { left: `${x}%`, top: `${y}%` }]}>
      {/* Outer Pulse */}
      <Animated.View style={[styles.pulseCircle, animatedPulseStyle]} />
      {/* Inner Core */}
      <Animated.View style={[styles.coreWrap, animatedButtonStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.coreButton}
        >
          <View style={styles.coreDot} />
        </Pressable>
        <Text style={styles.label}>シグナル</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pulseCircle: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.accentPrimary, // Orange
    borderColor: color.accentPrimary,
    borderWidth: 2,
  },
  coreWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  coreButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  coreDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFD700", // Bright yellow/gold for hacker vibe
    shadowColor: color.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    position: "absolute",
    top: 36,
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
