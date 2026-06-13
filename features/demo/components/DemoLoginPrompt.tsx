/**
 * DemoLoginPrompt
 * ログインへの誘導セクション
 */

import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { color } from "@/theme/tokens";

interface DemoLoginPromptProps {
  onLogin: () => void;
}

export function DemoLoginPrompt({ onLogin }: DemoLoginPromptProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>
        気に入りましたか？
      </Text>
      <Text style={[styles.body, { color: colors.muted }]}>
        ログインすると、実際のチャレンジに参加したり、自分でチャレンジを作成できます！
      </Text>
      <Pressable
        onPress={onLogin}
        accessibilityRole="button"
        accessibilityLabel="ログインして始める"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Ionicons name="log-in" size={20} color={color.textWhite} />
        <Text style={styles.buttonText}>ログインして始める</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
