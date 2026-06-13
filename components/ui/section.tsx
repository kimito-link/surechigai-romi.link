// components/ui/section.tsx
// v6.19: セクション関連の統一コンポーネント

import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";

// ==================== SectionHeader ====================

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  /** アイコン色（未指定時は textMuted） */
  iconColor?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * セクションヘッダー
 * 
 * @example
 * <SectionHeader title="チャレンジ一覧" />
 * <SectionHeader title="参加者" subtitle="100人" icon="people" />
 * <SectionHeader 
 *   title="設定" 
 *   action={<Button size="sm" onPress={handleEdit}>編集</Button>} 
 * />
 */
export function SectionHeader({ 
  title, 
  subtitle, 
  icon, 
  iconColor,
  action,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderLeft}>
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={iconColor ?? color.textMuted} 
            style={styles.sectionIcon}
          />
        )}
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && <View style={styles.sectionAction}>{action}</View>}
    </View>
  );
}

// ==================== EmptyState ====================

export interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
  /** キャラクター画像を表示する場合 */
  character?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * 空状態の表示
 * 
 * @example
 * <EmptyState 
 *   icon="inbox" 
 *   title="データがありません" 
 *   message="まだ何もありません。"
 * />
 * 
 * <EmptyState 
 *   title="チャレンジがありません" 
 *   message="新しいチャレンジを作成しましょう！"
 *   action={<Button onPress={handleCreate}>作成する</Button>}
 * />
 */
export function EmptyState({ 
  icon = "inbox", 
  title, 
  message, 
  action,
  character,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyState, style]}>
      {character ? (
        character
      ) : (
        <View style={styles.emptyIconContainer}>
          <MaterialIcons name={icon} size={48} color={color.textSubtle} />
        </View>
      )}
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

// ==================== Divider ====================

export interface DividerProps {
  style?: ViewStyle;
  /** ラベル付きディバイダー */
  label?: string;
}

/**
 * 区切り線
 * 
 * @example
 * <Divider />
 * <Divider label="または" />
 */
export function Divider({ style, label }: DividerProps) {
  if (label) {
    return (
      <View style={[styles.dividerWithLabel, style]}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{label}</Text>
        <View style={styles.dividerLine} />
      </View>
    );
  }
  
  return <View style={[styles.divider, style]} />;
}

// ==================== Spacer ====================

export interface SpacerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const spacerSizes = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/**
 * スペーサー
 * 
 * @example
 * <Spacer size="md" />
 */
export function Spacer({ size = "md" }: SpacerProps) {
  return <View style={{ height: spacerSizes[size] }} />;
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  // SectionHeader
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: color.textWhite,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: color.textMuted,
    marginTop: 2,
  },
  sectionAction: {
    marginLeft: 12,
  },
  
  // EmptyState
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 200,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: color.textWhite,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: color.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: 20,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: color.border,
    marginVertical: 16,
  },
  dividerWithLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: color.border,
  },
  dividerLabel: {
    fontSize: 13,
    color: color.textMuted,
    paddingHorizontal: 12,
  },
});

export default SectionHeader;
