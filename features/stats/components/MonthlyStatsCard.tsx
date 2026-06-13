/**
 * MonthlyStatsCard Component
 * 月別統計カードを表示
 */

import { View, Text } from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { color } from "@/theme/tokens";

interface MonthlyStat {
  month: string;
  count: number;
}

interface MonthlyStatsCardProps {
  monthlyStats: MonthlyStat[];
}

export function MonthlyStatsCard({ monthlyStats }: MonthlyStatsCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader title="月別アクティビティ" subtitle="過去6ヶ月の参加数推移" />
      <View style={{ marginTop: 16, gap: 12 }}>
        {monthlyStats.map((stat) => (
          <View
            key={stat.month}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <Text style={{ fontSize: 16, color: color.textWhite }}>{stat.month}</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: color.hostAccentLegacy }}>
              {stat.count}件
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
