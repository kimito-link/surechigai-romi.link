/**
 * server/routers/reminders.ts
 * 
 * リマインダー関連のルーター
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const remindersRouter = router({
  // リマインダーを作成
  create: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      reminderType: z.enum(["day_before", "day_of", "hour_before", "custom"]),
      customTime: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createReminder({
        challengeId: input.challengeId,
        userId: ctx.user.id,
        reminderType: input.reminderType,
        customTime: input.customTime ? new Date(input.customTime) : undefined,
      });
      return { success: !!result, id: result };
    }),

  // ユーザーのリマインダー一覧
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getRemindersForUser(ctx.user.id);
    }),

  // チャレンジのリマインダー設定を取得
  getForChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getUserReminderForChallenge(ctx.user.id, input.challengeId);
    }),

  // リマインダーを更新
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      reminderType: z.enum(["day_before", "day_of", "hour_before", "custom"]).optional(),
      customTime: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateReminder(input.id, {
        reminderType: input.reminderType,
        customTime: input.customTime ? new Date(input.customTime) : undefined,
      });
      return { success: true };
    }),

  // リマインダーを削除
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteReminder(input.id);
      return { success: true };
    }),
});
