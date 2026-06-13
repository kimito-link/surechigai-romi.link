/**
 * WeeklyActivityCard Component
 * 週別アクティビティカードを表示
 */

import { View, Text } from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { color } from "@/theme/tokens";

interface WeeklyActivity {
  week: string;
  count: number;
}

interface WeeklyActivityCardProps {
  weeklyActivity: WeeklyActivity[];
}

export function WeeklyActivityCard({ weeklyActivity }: WeeklyActivityCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader title="週別アクティビティ" subtitle="過去4週間の参加数推移" />
      <View style={{ marginTop: 16, gap: 12 }}>
        {weeklyActivity.map((activity) => (
          <View
            key={activity.week}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <Text style={{ fontSize: 16, color: color.textWhite }}>{activity.week}</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: color.hostAccentLegacy }}>
              {activity.count}件
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
