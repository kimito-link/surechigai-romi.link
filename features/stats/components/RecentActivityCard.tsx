/**
 * RecentActivityCard Component
 * 最近のアクティビティカードを表示
 */

import { View, Text } from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { color } from "@/theme/tokens";

interface RecentActivity {
  id: number;
  eventTitle: string;
  createdAt: string;
}

interface RecentActivityCardProps {
  recentActivity: RecentActivity[];
}

export function RecentActivityCard({ recentActivity }: RecentActivityCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader title="最近のアクティビティ" subtitle="直近10件の参加履歴" />
      <View style={{ marginTop: 16, gap: 12 }}>
        {recentActivity.map((activity) => (
          <View
            key={activity.id}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: color.textWhite }}>
              {activity.eventTitle}
            </Text>
            <Text style={{ fontSize: 14, color: color.textMuted, marginTop: 4 }}>
              {new Date(activity.createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
