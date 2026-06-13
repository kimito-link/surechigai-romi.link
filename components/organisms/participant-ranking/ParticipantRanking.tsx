/**
 * ParticipantRanking - メインコンポーネント
 * 
 * 単一責任: サブコンポーネントの組み立てとレイアウトのみ
 */

import { View, FlatList, StyleSheet } from "react-native";
import { useCallback } from "react";
import { color } from "@/theme/tokens";
import { RankItem } from "./RankItem";
import { RankingHeader } from "./RankingHeader";
import { RankingEmptyState } from "./RankingEmptyState";
import { MoreIndicator } from "./MoreIndicator";
import { useRankingData } from "./useRankingData";
import { DEFAULT_MAX_DISPLAY, DEFAULT_TITLE } from "./constants";
import type { ParticipantRankingProps, RankedParticipant } from "./types";

export function ParticipantRanking({
  participants,
  maxDisplay = DEFAULT_MAX_DISPLAY,
  showBadges = true,
  title = DEFAULT_TITLE,
}: ParticipantRankingProps) {
  const {
    rankedParticipants,
    avgContribution,
    hasMoreParticipants,
    remainingCount,
  } = useRankingData(participants, maxDisplay);

  const renderItem = useCallback(
    ({ item }: { item: RankedParticipant }) => (
      <RankItem
        participant={item}
        rank={item.rank}
        showBadge={showBadges}
      />
    ),
    [showBadges]
  );

  const keyExtractor = useCallback(
    (item: RankedParticipant) => `rank-${item.id}`,
    []
  );

  if (rankedParticipants.length === 0) {
    return <RankingEmptyState title={title} />;
  }

  return (
    <View style={styles.container}>
      <RankingHeader title={title} avgContribution={avgContribution} />

      <FlatList
        data={rankedParticipants}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />

      {hasMoreParticipants && <MoreIndicator remainingCount={remainingCount} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  listContent: {
    gap: 8,
  },
});
