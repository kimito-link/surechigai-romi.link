import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { color } from "@/theme/tokens";

type TextVariant = "h1" | "h2" | "h3" | "body" | "caption" | "label";
type TextColor = "default" | "muted" | "primary" | "success" | "warning" | "error";

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  bold?: boolean;
  center?: boolean;
}

const variantStyles = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
};

const colorStyles = {
  default: color.textPrimary,
  muted: color.textMuted,
  primary: color.hostAccentLegacy,
  success: color.success,
  warning: color.warning,
  error: color.danger,
};

/**
 * 統一されたテキストコンポーネント
 * 
 * バリアント:
 * - h1: 大見出し (28px)
 * - h2: 中見出し (24px)
 * - h3: 小見出し (20px)
 * - body: 本文 (16px)
 * - caption: キャプション (14px)
 * - label: ラベル (12px)
 */
export function Text({
  variant = "body",
  color = "default",
  bold = false,
  center = false,
  style,
  children,
  ...props
}: TextProps) {
  const variantStyle = variantStyles[variant];
  const textColor = colorStyles[color];

  return (
    <RNText
      style={[
        {
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
          fontWeight: bold ? "700" : variantStyle.fontWeight,
          color: textColor,
          textAlign: center ? "center" : "left",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
