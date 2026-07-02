import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { CreatorAvatar } from "@/components/molecules/creator-avatar";
import { openExternalUrl } from "@/lib/navigation/external-links";
import { buildCreatorXUrl } from "@/lib/event-creator-url";
import { color, palette } from "@/theme/tokens";

type Props = {
  creatorName?: string | null;
  creatorUsername?: string | null;
  creatorXId?: string | null;
  creatorProfileImage?: string | null;
  creatorXUrl?: string | null;
  /** 小さめ表示（マイページカード内など） */
  compact?: boolean;
};

/** 集まりカード — 主催者サムネ + 名前 + @ID + Xリンク */
export function EventCreatorLink({
  creatorName,
  creatorUsername,
  creatorXId,
  creatorProfileImage,
  creatorXUrl,
  compact = false,
}: Props) {
  const displayName = creatorName ?? creatorUsername ?? "主催者";
  const handle = creatorUsername ? creatorUsername.replace(/^@/, "") : null;
  const xUrl = creatorXUrl ?? buildCreatorXUrl(creatorUsername, creatorXId);
  const avatarSize = compact ? 28 : 36;
  const fallbackInitial = (displayName || handle || "?").slice(0, 1);

  const content = (
    <>
      <CreatorAvatar
        src={creatorProfileImage}
        alt={displayName}
        fallbackInitial={fallbackInitial}
        size={avatarSize}
        twitterHandle={handle}
        recyclingKey={`event-creator-${creatorXId ?? handle ?? displayName}`}
        style={[
          styles.avatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
        ]}
      />
      <View style={styles.info}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {displayName}
        </Text>
        {handle ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{handle}
          </Text>
        ) : creatorXId ? (
          <Text style={styles.handle} numberOfLines={1}>
            ID {creatorXId}
          </Text>
        ) : null}
      </View>
      {xUrl ? (
        <View style={styles.linkChip}>
          <Text style={styles.linkChipText}>𝕏</Text>
          <MaterialIcons name="open-in-new" size={12} color={color.textWhite} />
        </View>
      ) : null}
    </>
  );

  if (!xUrl) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => void openExternalUrl(xUrl)}
      accessibilityRole="link"
      accessibilityLabel={`${displayName}のXプロフィールを開く`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  rowPressed: {
    opacity: 0.85,
  },
  avatar: {
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: color.textPrimary,
  },
  nameCompact: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textSecondary,
  },
  handle: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.kimitoBlue,
  },
  linkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: color.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  linkChipText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "800",
  },
});
