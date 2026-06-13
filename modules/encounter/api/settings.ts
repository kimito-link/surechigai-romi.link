/**
 * modules/encounter/api/settings.ts
 *
 * settings tRPC ルーター。
 * - settings.pauseLocation: 位置一時停止
 * - settings.resume: 停止解除
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { getUserSettings, upsertUserSettings } from "../db/queries.js";

export const settingsRouter = router({
  /**
   * 位置一時停止（最大72時間）。
   */
  pauseLocation: protectedProcedure
    .input(z.object({ hours: z.number().min(1).max(72) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: true };

      const pausedUntil = new Date(Date.now() + input.hours * 60 * 60 * 1000);
      await upsertUserSettings(db, ctx.user.id, {
        locationPausedUntil: pausedUntil,
      });

      return { ok: true, pausedUntil };
    }),

  /**
   * 位置一時停止解除。
   */
  resume: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { ok: true };

    await upsertUserSettings(db, ctx.user.id, {
      locationPausedUntil: null,
    });

    return { ok: true };
  }),

  /**
   * 現在の設定を取得。
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    return getUserSettings(db, ctx.user.id);
  }),
});
