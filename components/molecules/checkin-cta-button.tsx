import { Pressable, Text, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";

type Props = {
  label?: string;
  compact?: boolean;
  style?: object;
};

export function CheckinCtaButton({
  label = "現在地を記録する",
  compact = false,
  style,
}: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/(tabs)/checkin");
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="チェックイン — 現在地を記録する"
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      <MaterialIcons
        name="my-location"
        size={compact ? 18 : 20}
        color={palette.white}
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: palette.kimitoOrange,
    shadowColor: palette.kimitoOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonCompact: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 14,
  },
});
