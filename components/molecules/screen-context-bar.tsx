import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette, SCREEN_CONTEXT_BAR_HEIGHT } from "@/theme/tokens";

export type ContextBarTone = "default" | "accent" | "warn";

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: ContextBarTone;
};

/** ヘッダー直下 — 画面の「次の一手」を1行で示す */
export function ScreenContextBar({
  message,
  actionLabel,
  onAction,
  tone = "default",
}: Props) {
  const bg =
    tone === "warn"
      ? palette.kimitoOrange + "18"
      : tone === "accent"
        ? palette.kimitoBlue + "12"
        : color.bg;

  return (
    <View style={[styles.bar, { backgroundColor: bg }]}>
      <MaterialIcons
        name={tone === "warn" ? "notifications-active" : "info-outline"}
        size={16}
        color={tone === "warn" ? palette.kimitoOrange : palette.kimitoBlue}
        style={{ marginRight: 6 }}
      />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export { SCREEN_CONTEXT_BAR_HEIGHT, SCREEN_CONTEXT_BAR_MAX_HEIGHT } from "@/theme/tokens";

const styles = StyleSheet.create({
  bar: {
    minHeight: SCREEN_CONTEXT_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  message: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: color.textSecondary,
    lineHeight: 17,
  },
  action: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlue,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.white,
  },
});
