/**
 * RankItem - ランキング行
 * 
 * 単一責任: 単一の参加者行の表示のみ
 */

import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, palette } from "@/theme/tokens";
import { formatParticipationDate } from "@/lib/format-date";
import { RANK_COLORS, GENDER_COLORS } from "./constants";
import { RankBadge } from "./RankBadge";
import { ParticipantAvatar } from "./ParticipantAvatar";
import type { RankItemProps } from "./types";

export function RankItem({ participant, rank, showBadge }: RankItemProps) {
  const isTopThree = rank <= 3;
  const genderStyle = GENDER_COLORS[participant.gender || "unspecified"];

  return (
    <View
      style={[
        styles.rankItem,
        isTopThree && styles.rankItemTop,
        { backgroundColor: genderStyle.bg, borderLeftWidth: 3, borderLeftColor: genderStyle.border },
      ]}
    >
      <RankBadge rank={rank} />

      <ParticipantAvatar
        profileImage={participant.profileImage}
        isAnonymous={participant.isAnonymous}
        rank={rank}
      />

      <View style={styles.userInfo}>
        <Text style={[styles.userName, isTopThree && styles.userNameTop]} numberOfLines={1}>
          {participant.isAnonymous ? "匿名" : participant.displayName}
        </Text>
        {participant.username && !participant.isAnonymous && (
          <Text style={styles.userHandle} numberOfLines={1}>
            @{participant.username}
          </Text>
        )}
        {participant.createdAt != null && (
          <Text style={styles.joinedAt} numberOfLines={1}>
            {formatParticipationDate(participant.createdAt)}参加
          </Text>
        )}
      </View>

      <View style={styles.contributionContainer}>
        <Text style={[styles.contributionValue, isTopThree && styles.contributionValueTop]}>
          {participant.contribution}
        </Text>
        <Text style={styles.contributionLabel}>貢献</Text>
      </View>

      {showBadge && isTopThree && (
        <View style={[styles.achievementBadge, { backgroundColor: RANK_COLORS[rank as 1 | 2 | 3].bg }]}>
          <MaterialIcons name="star" size={12} color={RANK_COLORS[rank as 1 | 2 | 3].text} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  rankItemTop: {
    backgroundColor: palette.gold + "0D", // 5% opacity
    borderWidth: 1,
    borderColor: palette.gold + "33", // 20% opacity
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  userNameTop: {
    fontSize: 15,
  },
  userHandle: {
    color: color.textSubtle,
    fontSize: 12,
  },
  joinedAt: {
    color: color.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  contributionContainer: {
    alignItems: "flex-end",
  },
  contributionValue: {
    color: color.hostAccentLegacy,
    fontSize: 18,
    fontWeight: "bold",
  },
  contributionValueTop: {
    fontSize: 20,
  },
  contributionLabel: {
    color: color.textSubtle,
    fontSize: 12,
  },
  achievementBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
