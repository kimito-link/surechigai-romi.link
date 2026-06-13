import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { color } from "@/theme/tokens";

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * 同期状態を表示するインジケーター
 * ペンディングアイテムがある場合に表示
 */
export function SyncStatusIndicator({
  showDetails = false,
  compact = false,
}: SyncStatusIndicatorProps) {
  const { isSyncing, pendingCount, lastSyncAt, lastError, hasPending, sync, retry } =
    useOfflineSync();
  const [expanded, setExpanded] = useState(showDetails);

  // 同期中のアニメーション
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isSyncing, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // ペンディングがなければ表示しない
  if (!hasPending && !isSyncing) {
    return null;
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "未同期";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${Math.floor(diffHours / 24)}日前`;
  };

  if (compact) {
    return (
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [
          styles.compactContainer,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.compactBadge}>
          {isSyncing ? (
            <Animated.Text style={[styles.syncIcon, animatedStyle]}>🔄</Animated.Text>
          ) : (
            <Text style={styles.pendingIcon}>📤</Text>
          )}
          <Text style={styles.compactCount}>{pendingCount}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.headerContent}>
          {isSyncing ? (
            <Animated.Text style={[styles.icon, animatedStyle]}>🔄</Animated.Text>
          ) : lastError ? (
            <Text style={styles.icon}>⚠️</Text>
          ) : (
            <Text style={styles.icon}>📤</Text>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {isSyncing
                ? "同期中..."
                : lastError
                ? "同期エラー"
                : `${pendingCount}件の保留中`}
            </Text>
            {!isSyncing && (
              <Text style={styles.subtitle}>
                {lastError || `最終同期: ${formatLastSync(lastSyncAt)}`}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            オフライン時に作成されたコンテンツは、インターネット接続が復帰すると自動的に同期されます。
          </Text>
          
          <View style={styles.actions}>
            <Pressable
              onPress={sync}
              disabled={isSyncing}
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryButton,
                pressed && styles.pressed,
                isSyncing && styles.disabled,
              ]}
            >
              <Text style={styles.actionButtonText}>
                {isSyncing ? "同期中..." : "今すぐ同期"}
              </Text>
            </Pressable>

            {lastError && (
              <Pressable
                onPress={retry}
                disabled={isSyncing}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.secondaryButton,
                  pressed && styles.pressed,
                  isSyncing && styles.disabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>再試行</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surfaceDark,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: color.border,
  },
  compactContainer: {
    padding: 4,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${color.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactCount: {
    color: color.warning,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  icon: {
    fontSize: 24,
  },
  syncIcon: {
    fontSize: 16,
  },
  pendingIcon: {
    fontSize: 16,
  },
  title: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  expandIcon: {
    color: color.textMuted,
    fontSize: 12,
  },
  details: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  detailText: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: color.info,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: color.textSubtle,
  },
  actionButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: color.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
