/**
 * StatsContent Component
 * 統計画面のメインコンテンツを表示
 */

import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";
import { SummaryCards } from "./SummaryCards";
import { MonthlyStatsCard } from "./MonthlyStatsCard";
import { WeeklyActivityCard } from "./WeeklyActivityCard";
import { RecentActivityCard } from "./RecentActivityCard";
import type { UserStats } from "../types";

interface StatsContentProps {
  userStats: UserStats;
}

export function StatsContent({ userStats }: StatsContentProps) {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: color.textWhite,
            marginBottom: 8,
          }}
        >
          統計ダッシュボード
        </Text>

        <SummaryCards summary={userStats.summary} />
        <MonthlyStatsCard monthlyStats={userStats.monthlyStats} />
        <WeeklyActivityCard weeklyActivity={userStats.weeklyActivity} />
        <RecentActivityCard recentActivity={userStats.recentActivity} />
      </ScrollView>
    </ScreenContainer>
  );
}
