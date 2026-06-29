import { useState } from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type CreatorAvatarProps = {
  src: string | null | undefined;
  alt: string;
  fallbackInitial: string;
  size?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
};

/**
 * X / Clerk アバター URL は 404 になることがある。
 * surechigai-nico の CreatorAvatar と同様、失敗時はイニシャルへフォールバック。
 */
export function CreatorAvatar({
  src,
  alt,
  fallbackInitial,
  size = 56,
  style,
}: CreatorAvatarProps) {
  const [errored, setErrored] = useState(false);
  const radius = size / 2;

  if (!src || errored) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}
        accessibilityLabel={alt}
      >
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {fallbackInitial.slice(0, 1)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={[
        { width: size, height: size, borderRadius: radius },
        style as StyleProp<ImageStyle>,
      ]}
      contentFit="cover"
      accessibilityLabel={alt}
      onError={() => setErrored(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "800",
    color: "#AAAAAA",
  },
});
