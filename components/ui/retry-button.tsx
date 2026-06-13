// components/ui/retry-button.tsx
// v6.20: 統一されたRetryButtonコンポーネント

import { Pressable, Text, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import * as Haptics from "expo-haptics";

// ==================== 型定義 ====================

export interface RetryButtonProps {
  onPress: () => void;
  label?: string;
  variant?: "retry" | "reload" | "tryAgain" | "primary";
  size?: "sm" | "md";
  disabled?: boolean;
}

// ==================== ラベル定義 ====================

const labelMap: Record<NonNullable<RetryButtonProps["variant"]>, string> = {
  retry: "再試行",
  reload: "再読み込み",
  tryAgain: "もう一度試す",
  primary: "再試行",
};

// ==================== RetryButton ====================

/**
 * 統一されたRetryButtonコンポーネント
 * エラーフォールバックで使用する再試行ボタン
 * 
 * @example
 * <RetryButton onPress={handleRetry} />
 * <RetryButton onPress={handleRetry} variant="reload" />
 * <RetryButton onPress={handleRetry} label="カスタムラベル" />
 */
export function RetryButton({
  onPress,
  label,
  variant = "retry",
  size = "md",
  disabled = false,
}: RetryButtonProps) {
  const displayLabel = label || labelMap[variant];
  const iconSize = size === "sm" ? 16 : 20;
  const fontSize = size === "sm" ? 13 : 14;

  const handlePress = () => {
    if (!disabled && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        size === "sm" && styles.buttonSm,
        variant === "primary" && styles.buttonPrimary,
        {
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
      ]}
    >
      <MaterialIcons name="refresh" size={iconSize} color={color.textWhite} />
      <Text style={[styles.text, variant === "primary" && styles.textPrimary, { fontSize }]}>
        {displayLabel}
      </Text>
    </Pressable>
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: color.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  buttonPrimary: {
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  text: {
    color: color.textWhite,
    fontWeight: "500",
  },
  textPrimary: {
    fontWeight: "600",
  },
});
