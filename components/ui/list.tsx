// components/ui/list.tsx
// v6.19: 統一されたリスト関連コンポーネント

import { useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Platform,
  type ViewStyle,
  type ImageStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";

// ==================== ListItem ====================

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** 左側のアイコン */
  icon?: keyof typeof MaterialIcons.glyphMap;
  /** 左側のアバター画像URL */
  avatar?: string;
  /** 右側のコンテンツ */
  right?: React.ReactNode;
  /** 右側に矢印を表示 */
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** 区切り線を表示 */
  showDivider?: boolean;
  style?: ViewStyle;
}

/**
 * リストアイテム
 * 
 * @example
 * // 基本
 * <ListItem title="設定" icon="settings" onPress={handleSettings} showChevron />
 * 
 * // アバター付き
 * <ListItem 
 *   title="山田太郎" 
 *   subtitle="@yamada"
 *   avatar="https://example.com/avatar.jpg"
 *   onPress={handleProfile}
 * />
 * 
 * // 右側にカスタムコンテンツ
 * <ListItem 
 *   title="通知" 
 *   icon="notifications"
 *   right={<Switch value={enabled} onValueChange={setEnabled} />}
 * />
 */
export function ListItem({
  title,
  subtitle,
  icon,
  avatar,
  right,
  showChevron = false,
  onPress,
  disabled = false,
  showDivider = true,
  style,
}: ListItemProps) {
  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  }, [disabled, onPress]);

  const content = (
    <View style={[styles.listItem, showDivider && styles.listItemDivider, style]}>
      {/* 左側 */}
      {(icon || avatar) && (
        <View style={styles.listItemLeft}>
          {avatar ? (
            <Avatar source={avatar} size="sm" />
          ) : icon ? (
            <View style={styles.listItemIconContainer}>
              <MaterialIcons name={icon} size={22} color={color.textMuted} />
            </View>
          ) : null}
        </View>
      )}
      
      {/* 中央 */}
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, disabled && styles.listItemDisabled]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.listItemSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {/* 右側 */}
      {(right || showChevron) && (
        <View style={styles.listItemRight}>
          {right}
          {showChevron && (
            <MaterialIcons name="chevron-right" size={24} color={color.textSubtle} />
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ==================== Avatar ====================

export interface AvatarProps {
  source?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallbackIcon?: keyof typeof MaterialIcons.glyphMap;
  style?: ImageStyle;
}

const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

/**
 * アバター
 * 
 * @example
 * <Avatar source="https://example.com/avatar.jpg" size="md" />
 * <Avatar fallbackIcon="person" size="lg" />
 */
export function Avatar({
  source,
  size = "md",
  fallbackIcon = "person",
  style,
}: AvatarProps) {
  const avatarSize = avatarSizes[size];
  
  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
          style,
        ]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      <MaterialIcons 
        name={fallbackIcon} 
        size={avatarSize * 0.5} 
        color={color.textSubtle} 
      />
    </View>
  );
}

// ==================== Badge ====================

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
  style?: ViewStyle;
}

const badgeVariants = {
  default: { bg: color.surface, text: color.textMuted },
  primary: { bg: color.accentPrimary, text: color.textWhite },
  success: { bg: color.success, text: color.textWhite },
  warning: { bg: color.warning, text: color.bg },
  error: { bg: color.danger, text: color.textWhite },
};

/**
 * バッジ
 * 
 * @example
 * <Badge variant="primary">新着</Badge>
 * <Badge variant="success" size="sm">完了</Badge>
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  style,
}: BadgeProps) {
  const variantStyle = badgeVariants[variant];
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.bg,
          paddingVertical: size === "sm" ? 2 : 4,
          paddingHorizontal: size === "sm" ? 6 : 8,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: variantStyle.text,
            fontSize: size === "sm" ? 10 : 12,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  // ListItem
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  listItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  listItemLeft: {
    marginRight: 12,
  },
  listItemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    color: color.textWhite,
    fontWeight: "500",
  },
  listItemSubtitle: {
    fontSize: 14,
    color: color.textMuted,
    marginTop: 2,
  },
  listItemRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  listItemDisabled: {
    color: color.textSubtle,
  },
  
  // Avatar
  avatar: {
    backgroundColor: color.surface,
  },
  avatarFallback: {
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Badge
  badge: {
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontWeight: "600",
  },
});

export default ListItem;
