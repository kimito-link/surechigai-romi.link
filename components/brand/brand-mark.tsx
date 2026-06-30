import { Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { APP_BRAND_ICON } from "@/components/brand/app-brand-icon";

type BrandMarkProps = {
  size?: number;
  onPress?: () => void;
};

/** ゆっくりりんく — タップでポスト（ホーム）へ */
export function BrandMark({ size = 36, onPress }: BrandMarkProps) {
  const router = useRouter();
  const radius = size / 2;

  return (
    <Pressable
      onPress={onPress ?? (() => router.push("/(tabs)"))}
      accessibilityRole="button"
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
