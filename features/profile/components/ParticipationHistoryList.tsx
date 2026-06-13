/**
 * features/profile/components/ParticipationHistoryList.tsx
 * 参加履歴カードリスト
 */

import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { commonCopy } from "@/constants/copy/common";
import type { ProfileParticipation } from "../types";

interface ParticipationHistoryListProps {
  participations: ProfileParticipation[];
  onPressItem: (challengeId: number) => void;
}

export const ParticipationHistoryList = memo(
  ({ participations, onPressItem }: ParticipationHistoryListProps) => {
    const colors = useColors();

    if (participations.length === 0) {
      return (
        <View style={styles.empty}>
          <MaterialIcons name="event-busy" size={48} color={color.textSubtle} />
          <Text style={styles.emptyText}>{commonCopy.empty.noParticipationHistory}</Text>
        </View>
      );
    }

    return (
      <>
        {participations.map((participation) => (
          <Pressable
            key={participation.challengeId}
            onPress={() => onPressItem(participation.challengeId)}
            style={styles.card}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {participation.challengeTitle ?? "チャレンジ"}
            </Text>
            <View style={styles.cardMeta}>
              <MaterialIcons name="people" size={16} color={color.textMuted} />
              <Text style={styles.cardMetaText}>
                貢献度: {participation.contribution}
              </Text>
            </View>
          </Pressable>
        ))}
      </>
    );
  }
);

ParticipationHistoryList.displayName = "ParticipationHistoryList";

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: color.textMuted,
    marginTop: 12,
  },
  card: {
    backgroundColor: color.surfaceDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  cardMetaText: {
    color: color.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
});
