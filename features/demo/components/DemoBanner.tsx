/**
 * DemoBanner
 * デモ体験中であることを示すバナーとリセットボタン
 */

import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

interface DemoBannerProps {
  onReset: () => void;
}

export function DemoBanner({ onReset }: DemoBannerProps) {
  const colors = useColors();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.warning + "20" }]}
      accessibilityRole="none"
      accessibilityLabel="デモ体験中です"
    >
      <Ionicons name="flask" size={20} color={colors.warning} />
      <Text style={[styles.label, { color: colors.warning }]}>
        これはデモ体験です。実際のチャレンジではありません。
      </Text>
      <Pressable
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel="デモをリセットする"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={[styles.resetText, { color: colors.warning }]}>リセット</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  resetText: {
    fontSize: 12,
  },
});
