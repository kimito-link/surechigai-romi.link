import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type * as Auth from "@/lib/_core/auth";
import { color, palette } from "@/theme/tokens";

type UserAccountChipProps = {
  user: Auth.User;
  compact?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

function formatFollowers(count?: number | null): string {
  if (typeof count !== "number" || !Number.isFinite(count)) return "取得中";
  return count.toLocaleString("ja-JP");
}

export function UserAccountChip({ user, compact = false, onPress, style }: UserAccountChipProps) {
  const displayName = user.name || user.username || "ロミユーザー";
  const accountId = user.username ? `@${user.username}` : user.twitterId ? user.twitterId : user.openId;
  const followers = formatFollowers(user.followersCount);
  const baseStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: compact ? 60 : 66,
    backgroundColor: color.successDark + "18",
    borderWidth: 1,
    borderColor: color.success + "42",
    borderRadius: 8,
    paddingHorizontal: compact ? 10 : 12,
    paddingVertical: compact ? 8 : 10,
    gap: compact ? 9 : 11,
  };

  const content = (
    <>
      <View style={[styles.avatarRing, { width: compact ? 42 : 48, height: compact ? 42 : 48, borderRadius: compact ? 21 : 24 }]}>
        {user.profileImage ? (
          <Image
            source={{ uri: user.profileImage }}
            style={{
              width: compact ? 36 : 42,
              height: compact ? 36 : 42,
              borderRadius: compact ? 18 : 21,
              backgroundColor: color.surfaceAlt,
            }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: compact ? 36 : 42,
              height: compact ? 36 : 42,
              borderRadius: compact ? 18 : 21,
              backgroundColor: color.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="person" size={compact ? 20 : 23} color={color.textMuted} />
          </View>
        )}
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.accountMain}>
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { fontSize: compact ? 10 : 11 }]} numberOfLines={1}>
              ログイン中
            </Text>
          </View>
          <Text
            style={[styles.accountName, { fontSize: compact ? 14 : 15 }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialIcons name="alternate-email" size={compact ? 12 : 13} color={color.textSubtle} />
            <Text style={[styles.metaLabel, { fontSize: compact ? 10 : 11 }]} numberOfLines={1}>
              アカウントID
            </Text>
            <Text style={[styles.metaValue, { fontSize: compact ? 11 : 12 }]} numberOfLines={1}>
              {accountId}
            </Text>
          </View>

          <View style={styles.metaPill}>
            <MaterialIcons name="groups" size={compact ? 12 : 13} color={color.successLight} />
            <Text style={[styles.metaValue, styles.followersValue, { fontSize: compact ? 11 : 12 }]} numberOfLines={1}>
              フォロワー {followers}
            </Text>
          </View>
        </View>
      </View>

      {onPress ? (
        <MaterialIcons name="expand-more" size={18} color={color.textMuted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed ? { opacity: 0.72, transform: [{ scale: 0.99 }] } : null, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  avatarRing: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.black + "55",
    borderWidth: 1,
    borderColor: color.success + "55",
  },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.success,
    borderWidth: 2,
    borderColor: color.bg,
  },
  accountMain: {
    minWidth: 0,
    flex: 1,
    gap: 5,
  },
  statusRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 20,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: color.successDark + "30",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.successLight,
  },
  statusText: {
    color: color.successLight,
    fontWeight: "800",
    letterSpacing: 0,
  },
  accountName: {
    minWidth: 0,
    flex: 1,
    color: color.textWhite,
    fontWeight: "800",
    letterSpacing: 0,
  },
  metaRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    minWidth: 0,
    maxWidth: "100%",
    minHeight: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: palette.black + "30",
    borderWidth: 1,
    borderColor: palette.white + "14",
  },
  metaLabel: {
    color: color.textMuted,
    fontWeight: "700",
    letterSpacing: 0,
  },
  metaValue: {
    minWidth: 0,
    color: color.textSubtle,
    fontWeight: "800",
    letterSpacing: 0,
  },
  followersValue: {
    color: color.successLight,
  },
});
