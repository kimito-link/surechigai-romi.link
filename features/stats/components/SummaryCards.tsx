/**
 * SummaryCards Component
 * 統計のサマリーカードを表示
 */

import { View, Text } from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { color } from "@/theme/tokens";

interface SummaryCardsProps {
  summary: {
    totalChallenges: number;
    completedChallenges: number;
    completionRate: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <View style={{ gap: 16 }}>
      <Card variant="elevated" padding="lg">
        <CardHeader title="総参加数" subtitle="あなたが参加したチャレンジの総数" />
        <Text
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: color.hostAccentLegacy,
            marginTop: 8,
          }}
        >
          {summary.totalChallenges}
        </Text>
      </Card>

      <Card variant="elevated" padding="lg">
        <CardHeader title="達成数" subtitle="完了したチャレンジの数" />
        <Text
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: color.hostAccentLegacy,
            marginTop: 8,
          }}
        >
          {summary.completedChallenges}
        </Text>
      </Card>

      <Card variant="elevated" padding="lg">
        <CardHeader title="達成率" subtitle="チャレンジの達成率" />
        <Text
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: color.hostAccentLegacy,
            marginTop: 8,
          }}
        >
          {summary.completionRate}%
        </Text>
      </Card>
    </View>
  );
}
