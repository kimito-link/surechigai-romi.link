/**
 * features/profile/components/ProfileFollowCountRow.tsx
 * フォロー中・フォロワー数表示行
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

interface ProfileFollowCountRowProps {
  followingCount: number;
  followerCount: number;
  onFollowingPress: () => void;
  onFollowersPress: () => void;
}

export const ProfileFollowCountRow = ({
  followingCount,
  followerCount,
  onFollowingPress,
  onFollowersPress,
}: ProfileFollowCountRowProps) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color.surfaceDark, borderBottomColor: color.border },
      ]}
    >
      <Pressable
        onPress={onFollowingPress}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={`${followingCount}人をフォロー中 フォロー一覧を表示`}
      >
        <Text style={[styles.count, { color: colors.foreground }]}>{followingCount}</Text>
        <Text style={styles.countLabel}>フォロー中</Text>
      </Pressable>
      <Pressable
        onPress={onFollowersPress}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={`フォロワー${followerCount}人 フォロワー一覧を表示`}
      >
        <Text style={[styles.count, { color: colors.foreground }]}>{followerCount}</Text>
        <Text style={styles.countLabel}>フォロワー</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  count: {
    fontSize: 18,
    fontWeight: "bold",
  },
  countLabel: {
    color: color.textMuted,
    fontSize: 14,
    marginLeft: 6,
  },
});
