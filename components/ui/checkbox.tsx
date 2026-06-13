// components/ui/checkbox.tsx
// v6.20: 統一されたCheckboxコンポーネント

import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FontAwesome6 } from "@expo/vector-icons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

// ==================== 型定義 ====================

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
  /** アイコン名（FontAwesome6） */
  icon?: string;
  /** チェック時のラベルスタイル（打ち消し線など） */
  checkedLabelStyle?: TextStyle;
  /** アクションボタン */
  actionButton?: {
    label: string;
    onPress: () => void;
    isActive?: boolean;
  };
}

// ==================== サイズ定義 ====================

const sizeStyles = {
  sm: {
    checkboxSize: 20,
    iconSize: 14,
    fontSize: 12,
  },
  md: {
    checkboxSize: 24,
    iconSize: 18,
    fontSize: 14,
  },
};

// ==================== Checkbox ====================

/**
 * 統一されたCheckboxコンポーネント
 * 
 * @example
 * // 基本的な使い方
 * <Checkbox
 *   checked={isChecked}
 *   onChange={setIsChecked}
 *   label="同意する"
 * />
 * 
 * // 説明文付き
 * <Checkbox
 *   checked={allowVideo}
 *   onChange={setAllowVideo}
 *   label="動画使用を許可"
 *   description="応援動画に使用される場合があります"
 * />
 * 
 * // 小さいサイズ
 * <Checkbox
 *   checked={isPublic}
 *   onChange={setIsPublic}
 *   label="公開する"
 *   size="sm"
 * />
 */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  size = "md",
  disabled = false,
  containerStyle,
  testID,
  icon,
  checkedLabelStyle,
  actionButton,
}: CheckboxProps) {
  const colors = useColors();
  const sizeStyle = sizeStyles[size];

  const handlePress = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, onChange, disabled]);

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.container,
          {
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={label}
        testID={testID ? `${testID}-pressable` : undefined}
      >
        {/* チェックボックス */}
        <View
          style={[
            styles.checkbox,
            {
              width: sizeStyle.checkboxSize,
              height: sizeStyle.checkboxSize,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: checked
                ? color.accentPrimary
                : disabled
                ? color.textDisabled
                : color.textHint,
              backgroundColor: checked ? color.accentPrimary : "transparent",
            },
          ]}
          testID={testID ? `${testID}-checkbox` : undefined}
        >
        {checked && (
          <MaterialIcons
            name="check"
            size={sizeStyle.iconSize}
            color={color.textWhite}
          />
        )}
        </View>

        {/* ラベル・説明文 */}
        <View style={styles.labelContainer}>
          <View style={styles.labelRow}>
            {icon && (
              <FontAwesome6
                name={icon as any}
                size={14}
                color={checked ? colors.muted : colors.primary}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.label,
                {
                  color: disabled ? color.textDisabled : colors.foreground,
                  fontSize: sizeStyle.fontSize,
                },
                checked && checkedLabelStyle,
              ]}
            >
              {label}
            </Text>
          </View>
          {description && (
            <Text
              style={[
                styles.description,
                {
                  color: color.textSecondary,
                  fontSize: sizeStyle.fontSize - 2,
                  marginLeft: icon ? 22 : 0,
                },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      </Pressable>
      
      {/* アクションボタン */}
      {actionButton && (
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary + "20" },
          ]}
          onPress={actionButton.onPress}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
            {actionButton.isActive ? "✓ コピー完了" : actionButton.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 44, // アクセシビリティ: 最小タッチターゲット
  },
  checkbox: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2, // ラベルと揃えるための微調整
  },
  labelContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontWeight: "600",
    lineHeight: 20,
  },
  description: {
    marginTop: 4,
    lineHeight: 16,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    marginHorizontal: 0,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
