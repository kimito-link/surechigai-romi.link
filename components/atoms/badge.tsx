import { View, Text, StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "primary";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

const variantStyles = {
  default: {
    bg: palette.gray400 + "33",
    text: color.textMuted,
    border: color.textSubtle,
  },
  success: {
    bg: color.success + "33",
    text: color.success,
    border: color.success,
  },
  warning: {
    bg: color.warning + "33",
    text: color.warning,
    border: color.warning,
  },
  error: {
    bg: color.danger + "33",
    text: color.danger,
    border: color.danger,
  },
  info: {
    bg: color.info + "33",
    text: color.info,
    border: color.info,
  },
  primary: {
    bg: color.hostAccentLegacy + "33",
    text: color.hostAccentLegacy,
    border: color.hostAccentLegacy,
  },
};

const sizeStyles = {
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 12,
    borderRadius: 4,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 12,
    borderRadius: 6,
  },
  lg: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    borderRadius: 8,
  },
};

/**
 * バッジコンポーネント
 * ステータス表示、タグ、カウンターなどに使用
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
        },
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: variantStyle.text,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
  },
});
