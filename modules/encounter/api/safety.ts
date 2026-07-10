/**
 * modules/encounter/api/safety.ts
 *
 * safety tRPC ルーター。
 * - safety.block
 * - safety.unblock
 * - safety.report（3件自動停止）
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../../server/_core/trpc.js";
import { requireDb } from "../../../server/db/connection.js";
import { blockUser, unblockUser, createReport } from "../db/queries.js";

const REPORT_REASONS = [
  "inappropriate_hitokoto",
  "spam",
  "harassment",
  "other",
] as const;

export const safetyRouter = router({
  /**
   * ブロック。
   */
  block: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "自分自身をブロックできません",
        });
      }

      const db = await requireDb();
      await blockUser(db, ctx.user.id, input.userId);
      return { ok: true };
    }),

  /**
   * ブロック解除。
   */
  unblock: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await unblockUser(db, ctx.user.id, input.userId);
      return { ok: true };
    }),

  /**
   * 通報。異なる reporter から3件で対象ユーザーを自動停止。
   */
  report: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        encounterId: z.number().optional(),
        reason: z.enum(REPORT_REASONS),
        detail: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.targetUserId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "自分自身を通報できません",
        });
      }

      const db = await requireDb();

      await createReport(db, {
        reporterId: ctx.user.id,
        targetUserId: input.targetUserId,
        encounterId: input.encounterId ?? null,
        reason: input.reason,
        detail: input.detail ?? null,
      });

      return { ok: true };
    }),
});
