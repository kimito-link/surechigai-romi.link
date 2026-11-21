/**
 * modules/encounter/api/safety.ts
 *
 * safety tRPC ルーター。
 * - safety.block
 * - safety.unblock
 * - safety.listBlocks（マイページのブロックリスト）
 * - safety.report（3件自動停止）
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../../server/_core/trpc.js";
import { requireDb } from "../../../server/db/connection.js";
import { blockUser, unblockUser, createReport, listBlockedUsers } from "../db/queries.js";
import { REPORT_REASONS } from "../core/report-reasons.js";

// 通報理由の正本は core/report-reasons.ts（UIと共有し二重管理を防ぐ）

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
   * 自分がブロックしている相手の一覧。
   */
  listBlocks: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return listBlockedUsers(db, ctx.user.id);
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
        /** 足あとの場所メモへの通報のとき、対象の locations.id */
        locationId: z.number().optional(),
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
        locationId: input.locationId ?? null,
        reason: input.reason,
        detail: input.detail ?? null,
      });

      return { ok: true };
    }),
});
