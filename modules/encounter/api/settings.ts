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
import { getDb, requireDb } from "../../../server/db/connection.js";
import { getUserSettings, upsertUserSettings } from "../db/queries.js";
import { deleteUserAccount } from "../db/account-deletion.js";
import { ACCOUNT_DELETION_CONFIRM_PHRASE } from "../core/account-deletion-confirm.js";
import { TRAIL_VISIBILITY_VALUES } from "../core/trail-visibility.js";

export const settingsRouter = router({
  /**
   * 位置一時停止（最大72時間）。
   */
  pauseLocation: protectedProcedure
    .input(z.object({ hours: z.number().min(1).max(72) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

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
    const db = await requireDb();

    await upsertUserSettings(db, ctx.user.id, {
      locationPausedUntil: null,
    });

    return { ok: true };
  }),

  /**
   * 公開共有サムネ(/u/<slug>)で正確な現在地を出すかの切替。
   * false（既定）= 市区町村粒度（500m丸め）/ true = 正確座標。
   */
  setSharePrecision: protectedProcedure
    .input(z.object({ precise: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      await upsertUserSettings(db, ctx.user.id, {
        shareLocationPrecise: input.precise,
      });

      return { ok: true, precise: input.precise };
    }),

  /**
   * 軌跡の公開範囲を設定。
   */
  setTrailVisibility: protectedProcedure
    .input(
      z.object({
        visibility: z.enum(TRAIL_VISIBILITY_VALUES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      await upsertUserSettings(db, ctx.user.id, {
        trailVisibility: input.visibility,
      });

      return { ok: true, visibility: input.visibility };
    }),

  /**
   * 現在の設定を取得。
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const settings = await getUserSettings(db, ctx.user.id);
    if (!settings) {
      return {
        locationPausedUntil: null,
        homeMaskCell: null,
        shareLocationPrecise: false,
        trailVisibility: "public" as const,
        livePresenceEnabled: false,
        livePresenceLat: null,
        livePresenceLng: null,
        livePresenceMunicipality: null,
        livePresenceUpdatedAt: null,
      };
    }
    return settings;
  }),

  /**
   * アカウント削除（退会）。不可逆。
   *
   * App Store Guideline 5.1.1(v) が「アプリ内にアカウント削除の導線」を必須と
   * しているため実装している。誤操作での消失を防ぐため、確認用の文字列
   * （"削除する"）の入力を必須にしている。
   *
   * 削除範囲と各テーブルの扱いは modules/encounter/db/account-deletion.ts を参照。
   */
  deleteAccount: protectedProcedure
    .input(z.object({ confirm: z.literal(ACCOUNT_DELETION_CONFIRM_PHRASE) }))
    .mutation(async ({ ctx }) => {
      const db = await requireDb();

      try {
        const result = await deleteUserAccount(db, ctx.user.id);
        return result;
      } catch (err) {
        console.error("[settings.deleteAccount] failed:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "アカウントの削除に失敗しました。時間をおいて再度お試しください",
        });
      }
    }),
});
