/**
 * Stats Feature Types
 * 統計機能の型定義
 */

export interface UserStats {
  summary: {
    totalChallenges: number;
    completedChallenges: number;
    completionRate: number;
  };
  monthlyStats: Array<{
    month: string;
    count: number;
  }>;
  weeklyActivity: Array<{
    week: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: number;
    eventTitle: string;
    createdAt: string;
  }>;
}
