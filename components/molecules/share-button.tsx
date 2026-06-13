import { Pressable, Text, View, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import * as Haptics from "expo-haptics";

interface ShareButtonProps {
  onPress: () => Promise<boolean>;
  label?: string;
  variant?: "primary" | "secondary" | "icon";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}

/**
 * シェアボタンコンポーネント
 */
export function ShareButton({
  onPress,
  label = "シェア",
  variant = "primary",
  size = "medium",
  disabled = false,
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      const result = await onPress();
      if (result) {
        setSuccess(true);
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // 成功表示を2秒後にリセット
        setTimeout(() => setSuccess(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = (pressed: boolean): ViewStyle[] => [
    styles.button,
    size === "small" ? styles.buttonSmall : size === "large" ? styles.buttonLarge : styles.buttonMedium,
    variant === "secondary" ? styles.buttonSecondary : variant === "icon" ? styles.buttonIcon : styles.buttonPrimary,
    disabled ? styles.buttonDisabled : {},
    success ? styles.buttonSuccess : {},
    pressed && !disabled && !loading ? { opacity: 0.7, transform: [{ scale: 0.97 }] } : {},
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    size === "small" ? styles.textSmall : size === "large" ? styles.textLarge : styles.textMedium,
    variant === "secondary" ? styles.textSecondary : styles.textPrimary,
  ];

  const iconSize = size === "small" ? 16 : size === "large" ? 24 : 20;

  if (variant === "icon") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading || disabled}
        style={({ pressed }) => getButtonStyle(pressed)}
      >
        {loading ? (
          <ActivityIndicator size="small" color={color.textWhite} />
        ) : success ? (
          <MaterialIcons name="check" size={iconSize} color={color.success} />
        ) : (
          <MaterialIcons name="share" size={iconSize} color={color.textWhite} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      style={({ pressed }) => getButtonStyle(pressed)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "secondary" ? color.accentPrimary : color.textWhite} />
      ) : (
        <View style={styles.content}>
          {success ? (
            <MaterialIcons name="check" size={iconSize} color={variant === "secondary" ? color.success : color.textWhite} />
          ) : (
            <MaterialIcons name="share" size={iconSize} color={variant === "secondary" ? color.accentPrimary : color.textWhite} />
          )}
          <Text style={textStyle}>
            {success ? "シェアしました！" : label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Twitterシェアボタン
 */
export function TwitterShareButton({
  onPress,
  label = "Xでシェア",
  size = "medium",
  disabled = false,
}: Omit<ShareButtonProps, "variant">) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      await onPress();
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = (pressed: boolean): ViewStyle[] => [
    styles.twitterButton,
    size === "small" ? styles.buttonSmall : size === "large" ? styles.buttonLarge : styles.buttonMedium,
    disabled ? styles.buttonDisabled : {},
    pressed && !disabled && !loading ? { opacity: 0.7, transform: [{ scale: 0.97 }] } : {},
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles.twitterText,
    size === "small" ? styles.textSmall : size === "large" ? styles.textLarge : styles.textMedium,
  ];

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      style={({ pressed }) => getButtonStyle(pressed)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color.textWhite} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.xLogo}>𝕏</Text>
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  buttonPrimary: {
    backgroundColor: color.accentPrimary,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: color.accentPrimary,
  },
  buttonIcon: {
    backgroundColor: palette.pink500 + "33",
    width: 44,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSuccess: {
    backgroundColor: color.success,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontWeight: "600",
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  textPrimary: {
    color: color.textWhite,
  },
  textSecondary: {
    color: color.accentPrimary,
  },
  twitterButton: {
    backgroundColor: palette.black,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  twitterText: {
    color: color.textWhite,
  },
  xLogo: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
});
