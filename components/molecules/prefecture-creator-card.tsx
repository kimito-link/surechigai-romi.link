import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { formatRelativeJa } from "@/lib/date-utils";
import {
  formatCreatorAccountId,
  formatCreatorDisplayName,
  formatFollowersCount,
  resolveCreatorLinkVisibility,
} from "@/modules/encounter/core/prefecture-creator";
import { palette } from "@/theme/tokens";

export type PrefectureCreator = {
  userId: number;
  displayName: string | null;
  username: string | null;
  profileImage: string | null;
  followersCount: number | null;
  kimitoLinkUrl: string | null;
  shareSlug: string | null;
  shareUrl: string | null;
  lastStayedAt: Date | string;
};

type PrefectureCreatorCardProps = {
  creator: PrefectureCreator;
  onOpenShareMap?: (shareSlug: string) => void;
};

function formatFollowers(count: number | null | undefined): string {
  return formatFollowersCount(count);
}

export function PrefectureCreatorCard({ creator, onOpenShareMap }: PrefectureCreatorCardProps) {
  const displayName = formatCreatorDisplayName(creator.displayName, creator.username);
  const accountId = formatCreatorAccountId(creator.username);
  const { showKimitoLink, showShareMap, kimitoLabel } = resolveCreatorLinkVisibility(creator);

  const openKimitoLink = () => {
    if (creator.kimitoLinkUrl) void Linking.openURL(creator.kimitoLinkUrl);
  };

  const openShareMap = () => {
    if (creator.shareSlug && onOpenShareMap) {
      onOpenShareMap(creator.shareSlug);
      return;
    }
    if (creator.shareUrl) void Linking.openURL(creator.shareUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        {creator.profileImage ? (
          <Image source={{ uri: creator.profileImage }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={28} color="#94A3B8" />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.displayName} numberOfLines={2}>
            {displayName}
          </Text>

          <View style={styles.metaPill}>
            <MaterialIcons name="alternate-email" size={13} color={palette.kimitoInkMuted} />
            <Text style={styles.metaLabel}>アカウントID</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {accountId}
            </Text>
          </View>

          <View style={styles.metaPill}>
            <MaterialIcons name="groups" size={13} color={palette.kimitoBlue} />
            <Text style={[styles.metaValue, styles.followersValue]} numberOfLines={1}>
              フォロワー {formatFollowers(creator.followersCount)}
            </Text>
          </View>

          <Text style={styles.stayedMeta}>
            この県に最後に滞在: {formatRelativeJa(creator.lastStayedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.linkRow}>
        {showKimitoLink && kimitoLabel ? (
          <Pressable
            onPress={openKimitoLink}
            style={({ pressed }) => [styles.linkBtnPrimary, pressed && styles.linkBtnPressed]}
            accessibilityRole="link"
          >
            <MaterialIcons name="link" size={16} color={palette.white} />
            <Text style={styles.linkBtnPrimaryText} numberOfLines={1}>
              {kimitoLabel}
            </Text>
          </Pressable>
        ) : null}

        {showShareMap ? (
          <Pressable
            onPress={openShareMap}
            style={({ pressed }) => [styles.linkBtnSecondary, pressed && styles.linkBtnPressed]}
            accessibilityRole="link"
          >
            <MaterialIcons name="map" size={16} color={palette.kimitoBlue} />
            <Text style={styles.linkBtnSecondaryText}>現在地を見る</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 12,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 22,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.kimitoInkMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  followersValue: {
    color: palette.kimitoBlue,
  },
  stayedMeta: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlue,
    flex: 1,
    minWidth: 160,
  },
  linkBtnPrimaryText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: palette.white,
  },
  linkBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: "rgba(0,66,123,0.2)",
  },
  linkBtnSecondaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.kimitoBlue,
  },
  linkBtnPressed: {
    opacity: 0.88,
  },
});
