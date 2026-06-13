import { View, StyleSheet, Animated, Platform, type ViewStyle, type DimensionValue } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { SKELETON_CONFIG } from "@/constants/skeleton-config";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * スケルトンローダーコンポーネント
 * コンテンツ読み込み中のプレースホルダーとして使用
 */
export function Skeleton({
  width = "100%" as DimensionValue,
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: SKELETON_CONFIG.animationDuration,
        useNativeDriver: Platform.OS !== "web",
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", color.textWhite + "1A", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

/**
 * カード型スケルトン
 */
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={120} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
        <Skeleton width="80%" height={24} borderRadius={8} />
      </View>
    </View>
  );
}

/**
 * リストアイテム型スケルトン
 */
export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}

/**
 * プロフィール型スケルトン
 */
export function ProfileSkeleton() {
  return (
    <View style={styles.profile}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width={120} height={18} style={{ marginBottom: 8 }} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

/**
 * チャレンジカード型スケルトン
 */
export function ChallengeCardSkeleton() {
  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="50%" height={14} style={{ marginBottom: 4 }} />
          <Skeleton width="30%" height={12} />
        </View>
      </View>
      <Skeleton width="80%" height={20} style={{ marginVertical: 12 }} />
      <Skeleton width="100%" height={8} borderRadius={4} style={{ marginBottom: 8 }} />
      <View style={styles.challengeStats}>
        <Skeleton width={60} height={24} borderRadius={6} />
        <Skeleton width={60} height={24} borderRadius={6} />
        <Skeleton width={60} height={24} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: color.border,
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    width: 200,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: color.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profileInfo: {
    marginLeft: 16,
  },
  challengeCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
