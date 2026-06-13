import { Platform, type ViewStyle } from "react-native";

/**
 * PC表示用ホバースタイルのユーティリティ
 * UXガイドライン: マウスデバイスではホバー効果を適用
 */

// ホバー時のシャドウスタイル（カード用）
export function getCardHoverShadow(isHovered: boolean): ViewStyle {
  if (Platform.OS !== "web" || !isHovered) return {};
  
  return {
    shadowColor: "#DD6500",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  };
}

// ホバー時のボーダースタイル
export function getHoverBorder(isHovered: boolean): ViewStyle {
  if (Platform.OS !== "web" || !isHovered) return {};
  
  return {
    borderColor: "#DD6500",
    borderWidth: 2,
  };
}

// ホバー時の背景色（リストアイテム用）
export function getListItemHoverBackground(isHovered: boolean): ViewStyle {
  if (Platform.OS !== "web" || !isHovered) return {};
  
  return {
    backgroundColor: "rgba(221, 101, 0, 0.08)",
  };
}

// ホバー時の左ボーダー（リストアイテム用）
export function getListItemHoverAccent(isHovered: boolean): ViewStyle {
  if (Platform.OS !== "web" || !isHovered) return {};
  
  return {
    borderLeftWidth: 3,
    borderLeftColor: "#DD6500",
  };
}

// ボタンのホバースタイル
export function getButtonHoverStyle(
  variant: "primary" | "secondary" | "outline" | "ghost",
  isHovered: boolean
): ViewStyle {
  if (Platform.OS !== "web" || !isHovered) return {};
  
  switch (variant) {
    case "primary":
      return {
        backgroundColor: "#FF7B00",
        shadowColor: "#DD6500",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      };
    case "secondary":
      return {
        backgroundColor: "#2A2D30",
        borderColor: "#DD6500",
      };
    case "outline":
      return {
        backgroundColor: "rgba(221, 101, 0, 0.1)",
        borderColor: "#FF7B00",
      };
    case "ghost":
      return {
        backgroundColor: "rgba(221, 101, 0, 0.1)",
      };
    default:
      return {};
  }
}

// Web用カーソルスタイル
export function getWebCursorStyle(disabled: boolean = false): ViewStyle {
  if (Platform.OS !== "web") return {};
  
  return {
    // @ts-ignore - Web専用プロパティ
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

// トランジションスタイル（Web用）
export function getWebTransitionStyle(): ViewStyle {
  if (Platform.OS !== "web") return {};
  
  return {
    // @ts-ignore - Web専用プロパティ
    transition: "all 0.15s ease-out",
  };
}

// ホバー時のスケールアニメーション設定
export const HOVER_ANIMATION_CONFIG = {
  duration: 150,
  scale: {
    default: 1,
    hovered: 1.02,
    pressed: 0.97,
  },
  translateY: {
    default: 0,
    hovered: -4,
  },
};

// カラーパレット（ホバー用）
export const HOVER_COLORS = {
  primary: {
    default: "#DD6500",
    hovered: "#FF7B00",
    pressed: "#CC5500",
  },
  secondary: {
    default: "#1E2022",
    hovered: "#2A2D30",
    pressed: "#151718",
  },
  accent: {
    default: "#DD6500",
    light: "rgba(221, 101, 0, 0.1)",
    lighter: "rgba(221, 101, 0, 0.08)",
  },
  shadow: {
    color: "#DD6500",
    opacity: 0.4,
  },
};
