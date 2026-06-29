import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatRelativeJa } from "@/lib/date-utils";
import type { PrefectureCreatorListRow } from "@/modules/encounter/core/prefecture-creator-types";
import { CreatorAvatar } from "@/components/molecules/creator-avatar";
import { palette } from "@/theme/tokens";

export type PrefectureCreator = PrefectureCreatorListRow;

type PrefectureCreatorCardProps = {
  creator: PrefectureCreator;
  onPress?: (shareSlug: string) => void;
};

/**
 * surechigai-nico の CreatorRow 相当。
 * アバター + 表示名 + （任意）@handle + 最終滞在。タップで /u/<shareSlug> へ。
 */
export function PrefectureCreatorCard({ creator, onPress }: PrefectureCreatorCardProps) {
  const fallbackInitial = (creator.displayName || creator.twitterHandle || "?").slice(0, 1);
  const canOpen = Boolean(creator.shareSlug && onPress);

  const content = (
    <>
      <CreatorAvatar
        src={creator.profileImage}
        alt={creator.displayName}
        fallbackInitial={fallbackInitial}
        recyclingKey={`creator-${creator.userId}`}
        style={styles.avatar}
      />

      <View style={styles.info}>
        <Text style={styles.displayName} numberOfLines={1}>
          {creator.displayName}
        </Text>
        {creator.twitterHandle ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{creator.twitterHandle.replace(/^@/, "")}
          </Text>
        ) : null}
        <Text style={styles.stayedMeta}>
          この県に最後に滞在: {formatRelativeJa(creator.lastStayedAt)}
        </Text>
      </View>

      {creator.isLive ? (
        <View style={styles.liveBadge} accessibilityLabel="LIVE">
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ) : canOpen ? (
        <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
      ) : null}
    </>
  );

  if (!canOpen) {
    return (
      <View style={[styles.card, creator.isLive && styles.cardLive]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress!(creator.shareSlug!)}
      style={({ pressed }) => [
        styles.card,
        creator.isLive && styles.cardLive,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="link"
      accessibilityLabel={`${creator.displayName}の軌跡を見る`}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cardLive: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FFFBFB",
  },
  cardPressed: {
    borderColor: palette.kimitoBlue,
    opacity: 0.92,
  },
  avatar: {
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A202C",
    lineHeight: 20,
  },
  handle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D9BF0",
  },
  stayedMeta: {
    fontSize: 11,
    color: "#8A7960",
    marginTop: 2,
    lineHeight: 16,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
});
