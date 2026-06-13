import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db/connection";
import { participations, users, challenges } from "../../drizzle/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";

export const statsRouter = router({
  /**
   * ユーザー統計を取得
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("データベースに接続できません");

    const userId = ctx.user.id;

    // 総参加数を取得
    const totalParticipations = await db
      .select({ count: count() })
      .from(participations)
      .where(eq(participations.userId, userId));

    // 達成数を取得（全ての参加をカウント）
    const completedParticipations = await db
      .select({ count: count() })
      .from(participations)
      .where(eq(participations.userId, userId));

    const total = totalParticipations[0]?.count || 0;
    const completed = completedParticipations[0]?.count || 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // 最近のアクティビティを取得（直近10件）
    const recentActivity = await db
      .select({
        id: participations.id,
        challengeId: participations.challengeId,
        createdAt: participations.createdAt,
        updatedAt: participations.updatedAt,
        eventTitle: challenges.title,
      })
      .from(participations)
      .leftJoin(challenges, eq(participations.challengeId, challenges.id))
      .where(eq(participations.userId, userId))
      .orderBy(desc(participations.createdAt))
      .limit(10);

    // 月別統計を取得（過去6ヶ月）
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await db
      .select({
        month: sql<string>`DATE_FORMAT(${participations.createdAt}, '%Y-%m')`,
        count: count(),
      })
      .from(participations)
      .where(
        and(
          eq(participations.userId, userId),
          gte(participations.createdAt, sixMonthsAgo)
        )
      )
      .groupBy(sql`DATE_FORMAT(${participations.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${participations.createdAt}, '%Y-%m')`);

    // 週別アクティビティを取得（過去4週間）
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyActivity = await db
      .select({
        week: sql<string>`DATE_FORMAT(${participations.createdAt}, '%Y-W%u')`,
        count: count(),
      })
      .from(participations)
      .where(
        and(
          eq(participations.userId, userId),
          gte(participations.createdAt, fourWeeksAgo)
        )
      )
      .groupBy(sql`DATE_FORMAT(${participations.createdAt}, '%Y-W%u')`)
      .orderBy(sql`DATE_FORMAT(${participations.createdAt}, '%Y-W%u')`);

    return {
      summary: {
        totalChallenges: total,
        completedChallenges: completed,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        eventTitle: activity.eventTitle || "不明なイベント",
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      })),
      monthlyStats: monthlyStats.map((stat: any) => ({
        month: stat.month,
        count: stat.count,
      })),
      weeklyActivity: weeklyActivity.map((activity: any) => ({
        week: activity.week,
        count: activity.count,
      })),
    };
  }),

  /**
   * 管理者統計を取得
   */
  getAdminStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("データベースに接続できません");

    // 管理者権限チェックは省略（必要に応じて実装）

    // 総ユーザー数を取得
    const totalUsers = await db.select({ count: count() }).from(users);

    // 総参加数を取得
    const totalParticipations = await db
      .select({ count: count() })
      .from(participations);

    // 総達成数を取得（全ての参加をカウント）
    const completedParticipations = await db
      .select({ count: count() })
      .from(participations);

    const total = totalParticipations[0]?.count || 0;
    const completed = completedParticipations[0]?.count || 0;
    const averageCompletionRate = total > 0 ? (completed / total) * 100 : 0;

    // トップユーザーを取得（参加数トップ10）
    const topUsers = await db
      .select({
        userId: participations.userId,
        userName: users.name,
        completedChallenges: count(),
      })
      .from(participations)
      .leftJoin(users, eq(participations.userId, users.id))
      .groupBy(participations.userId, users.name)
      .orderBy(desc(count()))
      .limit(10);

    // イベント別統計を取得
    const eventStats = await db
      .select({
        challengeId: participations.challengeId,
        eventTitle: challenges.title,
        totalAttempts: count(),
        completedAttempts: count(),  // 全ての参加を達成とみなす
      })
      .from(participations)
      .leftJoin(challenges, eq(participations.challengeId, challenges.id))
      .groupBy(participations.challengeId, challenges.title)
      .orderBy(desc(count()));

    // 日別アクティビティを取得（過去30日間）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await db
      .select({
        date: sql<string>`DATE(${participations.createdAt})`,
        count: count(),
      })
      .from(participations)
      .where(gte(participations.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${participations.createdAt})`)
      .orderBy(sql`DATE(${participations.createdAt})`);

    return {
      summary: {
        totalUsers: totalUsers[0]?.count || 0,
        totalChallenges: total,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
      },
      topUsers: topUsers.map((u: any) => ({
        userId: u.userId,
        name: u.userName || "不明なユーザー",
        completedChallenges: u.completedChallenges,
      })),
      eventStats: eventStats.map((s: any) => ({
        challengeId: s.challengeId,
        eventTitle: s.eventTitle || "不明なイベント",
        totalAttempts: s.totalAttempts,
        completedAttempts: s.completedAttempts,
        completionRate:
          s.totalAttempts > 0
            ? Math.round(
                (s.completedAttempts / s.totalAttempts) * 10000
              ) / 100
            : 0,
      })),
      dailyActivity: dailyActivity.map((a: any) => ({
        date: a.date,
        count: a.count,
      })),
    };
  }),
});
