import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailRow } from "./DetailRow";

export interface DataIntegrityChallenge {
  id: number;
  title: string;
  hostName: string;
  hostUsername: string | null;
  status: string;
  goalValue: number;
  storedCurrentValue: number;
  actualParticipantCount: number;
  actualTotalContribution: number;
  hasDiscrepancy: boolean;
  discrepancyAmount: number;
  participationBreakdown: {
    totalParticipations: number;
    totalContribution: number;
    totalCompanions: number;
  };
}

interface DataIntegrityChallengeCardProps {
  challenge: DataIntegrityChallenge;
  colors: {
    surface: string;
    foreground: string;
    muted: string;
    primary: string;
    error: string;
    success: string;
    border: string;
  };
}

const cardStyles = StyleSheet.create({
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});

export function DataIntegrityChallengeCard({
  challenge,
  colors,
}: DataIntegrityChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => [
        cardStyles.challengeCard,
        {
          backgroundColor: colors.surface,
          borderColor: challenge.hasDiscrepancy ? colors.error : colors.border,
          borderWidth: challenge.hasDiscrepancy ? 2 : 1,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            {challenge.hasDiscrepancy && (
              <Ionicons
                name="warning"
                size={16}
                color={colors.error}
                style={{ marginRight: 6 }}
              />
            )}
            <Text className="text-foreground font-semibold" numberOfLines={1}>
              {challenge.title}
            </Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            ID: {challenge.id} | {challenge.hostName}{" "}
            {challenge.hostUsername ? `@${challenge.hostUsername}` : ""}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.muted}
        />
      </View>

      {/* 数値比較 */}
      <View className="flex-row items-center justify-between py-2 border-t border-border">
        <View className="flex-1">
          <Text className="text-xs text-muted">保存値</Text>
          <Text
            className="text-lg font-bold"
            style={{
              color: challenge.hasDiscrepancy ? colors.error : colors.foreground,
            }}
          >
            {challenge.storedCurrentValue}
          </Text>
        </View>
        <View className="px-4">
          <Ionicons
            name={
              challenge.hasDiscrepancy ? "close-circle" : "checkmark-circle"
            }
            size={24}
            color={challenge.hasDiscrepancy ? colors.error : colors.success}
          />
        </View>
        <View className="flex-1 items-end">
          <Text className="text-xs text-muted">実際値</Text>
          <Text
            className="text-lg font-bold"
            style={{ color: colors.primary }}
          >
            {challenge.actualTotalContribution}
          </Text>
        </View>
      </View>

      {/* 差分表示 */}
      {challenge.hasDiscrepancy && (
        <View className="py-2 px-3 bg-error/10 rounded-lg mt-2">
          <Text className="text-error text-sm font-medium">
            差分:{" "}
            {challenge.discrepancyAmount > 0 ? "+" : ""}
            {challenge.discrepancyAmount}
          </Text>
        </View>
      )}

      {/* 展開時の詳細 */}
      {expanded && (
        <View className="mt-4 pt-4 border-t border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">
            内訳
          </Text>
          <View style={{ gap: 8 }}>
            <DetailRow
              label="参加登録数"
              value={challenge.participationBreakdown.totalParticipations}
            />
            <DetailRow
              label="本人貢献"
              value={challenge.participationBreakdown.totalContribution}
            />
            <DetailRow
              label="同伴者数"
              value={challenge.participationBreakdown.totalCompanions}
            />
            <DetailRow label="目標値" value={challenge.goalValue} />
            <DetailRow
              label="達成率"
              value={`${Math.round((challenge.actualTotalContribution / challenge.goalValue) * 100)}%`}
            />
            <DetailRow label="ステータス" value={challenge.status} />
          </View>
        </View>
      )}
    </Pressable>
  );
}
