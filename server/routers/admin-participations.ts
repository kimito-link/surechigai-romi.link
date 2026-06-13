/**
 * server/routers/admin-participations.ts
 *
 * 管理者用参加管理API（v6.44）
 * - 削除済み投稿一覧
 * - 復元
 * - 一括削除・一括復元
 * - 全て audit_logs + requestId 連動
 */
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const adminParticipationsRouter = router({
  listDeleted: adminProcedure
    .input(z.object({
      challengeId: z.number().optional(),
      userId: z.number().optional(),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input }) => {
      return db.getDeletedParticipations({
        challengeId: input.challengeId,
        userId: input.userId,
        limit: input.limit,
      });
    }),

  restore: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const before = await db.getParticipationById(input.id);
      if (!before) {
        throw new Error("参加が見つかりません");
      }
      const result = await db.restoreParticipation(input.id);
      const requestId = ctx.requestId || "unknown";
      await db.logAction({
        action: "RESTORE",
        entityType: "participation",
        targetId: input.id,
        actorId: ctx.user.id,
        actorName: ctx.user.name || "Unknown",
        beforeData: {
          deletedAt: before.deletedAt?.toISOString() || null,
          deletedBy: before.deletedBy,
        },
        afterData: { deletedAt: null, deletedBy: null },
        requestId,
      });
      return { ...result, requestId };
    }),

  bulkDelete: adminProcedure
    .input(z.object({
      challengeId: z.number().optional(),
      userId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.challengeId && !input.userId) {
        throw new Error("challengeId または userId を指定してください");
      }
      const result = await db.bulkSoftDeleteParticipations(
        { challengeId: input.challengeId, userId: input.userId },
        ctx.user.id
      );
      const requestId = ctx.requestId || "unknown";
      await db.logAction({
        action: "BULK_DELETE",
        entityType: "participation",
        targetId: input.challengeId || input.userId || 0,
        actorId: ctx.user.id,
        actorName: ctx.user.name || "Unknown",
        beforeData: null,
        afterData: {
          filter: input,
          deletedCount: result.deletedCount,
          affectedChallengeIds: result.affectedChallengeIds,
        },
        requestId,
      });
      return { success: true, ...result, requestId };
    }),

  bulkRestore: adminProcedure
    .input(z.object({
      challengeId: z.number().optional(),
      userId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.challengeId && !input.userId) {
        throw new Error("challengeId または userId を指定してください");
      }
      const result = await db.bulkRestoreParticipations({
        challengeId: input.challengeId,
        userId: input.userId,
      });
      const requestId = ctx.requestId || "unknown";
      await db.logAction({
        action: "BULK_RESTORE",
        entityType: "participation",
        targetId: input.challengeId || input.userId || 0,
        actorId: ctx.user.id,
        actorName: ctx.user.name || "Unknown",
        beforeData: null,
        afterData: {
          filter: input,
          restoredCount: result.restoredCount,
          affectedChallengeIds: result.affectedChallengeIds,
        },
        requestId,
      });
      return { success: true, ...result, requestId };
    }),

  getAuditLogs: adminProcedure
    .input(z.object({
      entityType: z.string().optional(),
      targetId: z.number().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return db.getAuditLogs({
        entityType: input.entityType || "participation",
        targetId: input.targetId,
        limit: input.limit,
      });
    }),
});
