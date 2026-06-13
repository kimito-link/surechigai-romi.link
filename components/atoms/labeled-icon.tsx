import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors, typography } from "@/constants/design-system";

interface LabeledIconProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  labelPosition?: "bottom" | "right";
  showLabel?: boolean;
}

const sizeConfig = {
  sm: {
    iconSize: 16,
    fontSize: 10,
    gap: 2,
  },
  md: {
    iconSize: 24,
    fontSize: 12,
    gap: 4,
  },
  lg: {
    iconSize: 32,
    fontSize: 14,
    gap: 6,
  },
};

/**
 * ラベル付きアイコンコンポーネント
 * 
 * UI/UXガイドに基づく設計:
 * - アクセシビリティ: アイコンの意味をテキストで補足
 * - 一貫性: 統一されたサイズとスタイル
 * - 認識しやすさ: アイコン+ラベルで直感的に理解
 */
export function LabeledIcon({
  icon,
  label,
  size = "md",
  color = colors.text.secondary,
  labelPosition = "bottom",
  showLabel = true,
}: LabeledIconProps) {
  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        labelPosition === "right" ? styles.horizontal : styles.vertical,
        { gap: config.gap },
      ]}
    >
      <MaterialIcons name={icon} size={config.iconSize} color={color} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: config.fontSize,
              color,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  vertical: {
    flexDirection: "column",
  },
  horizontal: {
    flexDirection: "row",
  },
  label: {
    fontWeight: typography.fontWeight.medium,
    textAlign: "center",
  },
});
