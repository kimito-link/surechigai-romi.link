import { Pressable, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { APP_BRAND_ICON } from "@/components/brand/app-brand-icon";
import { navigate } from "@/lib/navigation";

type BrandMarkProps = {
  size?: number;
  onPress?: () => void;
};

/** ゆっくりりんくアイコンのみ — タップでポスト（ホーム）へ */
export function BrandMark({ size = 36, onPress }: BrandMarkProps) {
  const radius = size / 2;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigate.toHome();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel="君斗りんくのすれ違ひ通信 — ホーム"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Image
        source={APP_BRAND_ICON}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});
