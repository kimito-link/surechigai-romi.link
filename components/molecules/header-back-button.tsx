import { Pressable, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { useRouter } from "expo-router";
import { palette } from "@/theme/tokens";

type Props = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** 子画面ヘッダー左 — 戻る（デフォルト router.back） */
export function HeaderBackButton({
  onPress,
  accessibilityLabel = "戻る",
}: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <MaterialIcons name="arrow-back" size={24} color={palette.kimitoBlue} />
    </Pressable>
  );
}

/** 子画面からポスト（ホーム）へ */
export function HeaderHomeButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.push("/(tabs)"))}
      accessibilityRole="link"
      accessibilityLabel="ホーム — ポスト"
      hitSlop={8}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  pressed: {
    opacity: 0.75,
  },
});
