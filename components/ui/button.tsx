// components/ui/button.tsx
// v6.19: 統一されたボタンコンポーネント
// Button, LoadingButton, HoverableButton, FloatingActionButtonを統合

import { useState, useCallback } from "react";
import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  View, 
  Platform, 
  StyleSheet,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from "react-native-reanimated";
import { color, palette } from "@/theme/tokens";

// ==================== 型定義 ====================

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  onPress: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  haptic?: boolean;
  /** 非同期処理を自動でローディング状態にするか */
  autoLoading?: boolean;
  /** カスタムスタイル */
  style?: ViewStyle | (ViewStyle | false | undefined)[];
}

// ==================== スタイル定義 ====================

const variantStyles = {
  primary: {
    bg: color.accentPrimary,
    text: color.textWhite,
    border: "transparent",
    activeBg: "#00335F", // kimitoBlue を暗くした押下色
    hoverBg: "#0A5290", // kimitoBlue を明るくしたホバー色
  },
  secondary: {
    bg: color.surface,
    text: color.accentPrimary, // 白背景に白文字バグ修正（ネイビー文字へ）
    border: color.accentPrimary,
    activeBg: color.accentPrimary + "14", // 8% opacity
    hoverBg: color.accentPrimary + "0D", // 5% opacity
  },
  outline: {
    bg: "transparent",
    text: color.accentPrimary,
    border: color.accentPrimary,
    activeBg: color.accentPrimary + "1A", // 10% opacity
    hoverBg: color.accentPrimary + "26", // 15% opacity
  },
  ghost: {
    bg: "transparent",
    text: color.textSecondary,
    border: "transparent",
    activeBg: color.accentPrimary + "1A", // 10% opacity
    hoverBg: color.accentPrimary + "0D", // 5% opacity
  },
  destructive: {
    bg: color.danger,
    text: color.textWhite,
    border: "transparent",
    activeBg: color.dangerDark,
    hoverBg: palette.red600, // #dc2626
  },
};

const sizeStyles = {
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    iconSize: 16,
    minHeight: 44, // Apple HIG準拠
    borderRadius: 10,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    iconSize: 20,
    minHeight: 48,
    borderRadius: 12,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 18,
    iconSize: 24,
    minHeight: 56,
    borderRadius: 14,
  },
};

// ==================== メインコンポーネント ====================

/**
 * 統一されたボタンコンポーネント
 * 
 * UI/UXガイドに基づく設計:
 * - 最低タッチターゲット: 44x44px (Apple HIG準拠)
 * - 即時フィードバック: ローディング状態、触覚フィードバック
 * - 一貫したデザイン: プライマリ/セカンダリ/アウトライン/ゴースト/破壊的
 * - アクセシビリティ: 十分なコントラスト比
 * - PC対応: ホバー効果
 * 
 * @example
 * // 基本的な使い方
 * <Button onPress={handleSubmit}>送信</Button>
 * 
 * // バリアント
 * <Button variant="secondary" onPress={handleCancel}>キャンセル</Button>
 * 
 * // アイコン付き
 * <Button icon="add" onPress={handleAdd}>追加</Button>
 * 
 * // 非同期処理（自動ローディング）
 * <Button autoLoading onPress={async () => await submitForm()}>保存</Button>
 */
export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  haptic = true,
  autoLoading = false,
  style,
}: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  
  const actualLoading = loading || isLoading;
  const isDisabled = disabled || actualLoading;

  const handlePress = useCallback(async () => {
    if (isDisabled) return;
    
    // 触覚フィードバック
    if (haptic && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (autoLoading) {
      setIsLoading(true);
      try {
        await onPress();
      } finally {
        setIsLoading(false);
      }
    } else {
      onPress();
    }
  }, [isDisabled, haptic, autoLoading, onPress]);

  const handleHoverIn = useCallback(() => {
    if (Platform.OS === "web" && !isDisabled) {
      setIsHovered(true);
    }
  }, [isDisabled]);

  const handleHoverOut = useCallback(() => {
    if (Platform.OS === "web") {
      setIsHovered(false);
    }
  }, []);

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      setIsPressed(true);
    }
  }, [isDisabled]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  // 動的背景色
  const backgroundColor = isPressed 
    ? variantStyle.activeBg 
    : isHovered 
      ? variantStyle.hoverBg 
      : variantStyle.bg;

  // Web用ホバースタイル
  const webHoverStyle: ViewStyle = Platform.OS === "web" && isHovered ? {
    shadowColor: variantStyle.bg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  } : {};

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: variantStyle.border,
          borderWidth: variant === "outline" || variant === "secondary" ? 1 : 0,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          minHeight: sizeStyle.minHeight,
          borderRadius: sizeStyle.borderRadius,
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: isPressed ? 0.97 : 1 }],
        },
        webHoverStyle,
        fullWidth && styles.fullWidth,
        ...(Array.isArray(style) ? style.filter(Boolean) : style ? [style] : []),
      ]}
    >
      {actualLoading ? (
        <ActivityIndicator size="small" color={variantStyle.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <MaterialIcons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.text}
              style={styles.iconLeft}
            />
          )}
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
          {icon && iconPosition === "right" && (
            <MaterialIcons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.text}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

// ==================== IconButton ====================

export interface IconButtonProps {
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
}

/**
 * アイコンのみのボタン
 * 
 * @example
 * <IconButton icon="close" onPress={handleClose} accessibilityLabel="閉じる" />
 */
export function IconButton({
  onPress,
  icon,
  variant = "ghost",
  size = "md",
  disabled = false,
  haptic = true,
  accessibilityLabel,
}: IconButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const buttonSize = sizeStyle.minHeight;

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    if (haptic && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  }, [disabled, haptic, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.iconButton,
        {
          backgroundColor: variantStyle.bg,
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <MaterialIcons
        name={icon}
        size={sizeStyle.iconSize}
        color={variantStyle.text}
      />
    </Pressable>
  );
}

// ==================== FloatingActionButton ====================

export interface FABProps {
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  label?: string;
  position?: "bottom-right" | "bottom-center";
  size?: "small" | "medium" | "large";
  accessibilityLabel?: string;
}

const FAB_SIZE_CONFIG = {
  small: { button: 48, icon: 24 },
  medium: { button: 56, icon: 28 },
  large: { button: 64, icon: 32 },
};

/**
 * フローティングアクションボタン
 * 
 * @example
 * <FAB icon="add" onPress={handleCreate} />
 */
export function FAB({
  onPress,
  icon = "add",
  label,
  position = "bottom-right",
  size = "medium",
  accessibilityLabel,
}: FABProps) {
  const scale = useSharedValue(1);
  const sizeConfig = FAB_SIZE_CONFIG[size];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const positionStyle = position === "bottom-center" 
    ? styles.fabPositionCenter 
    : styles.fabPositionRight;

  return (
    <Animated.View style={[styles.fabContainer, positionStyle, animatedStyle]}>
      {label && (
        <View style={styles.fabLabelContainer}>
          <Text style={styles.fabLabelText}>{label}</Text>
        </View>
      )}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? "アクション"}
        style={[
          styles.fabButton,
          {
            width: sizeConfig.button,
            height: sizeConfig.button,
            borderRadius: sizeConfig.button / 2,
          }
        ]}
      >
        <MaterialIcons name={icon} size={sizeConfig.icon} color={color.textWhite} />
      </Pressable>
    </Animated.View>
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  // FAB styles
  fabContainer: {
    position: "absolute",
    bottom: 100,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
  },
  fabPositionRight: {
    right: 20,
  },
  fabPositionCenter: {
    left: "50%",
    transform: [{ translateX: -28 }],
  },
  fabButton: {
    backgroundColor: color.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.gray900, // #000 → 黒ベースの背景色
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLabelContainer: {
    backgroundColor: color.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: palette.gray900, // #000 → 黒ベースの背景色
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabLabelText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Button;
