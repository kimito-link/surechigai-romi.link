/**
 * modules/event/api/participation.ts
 *
 * 集まりへの参加表明 API（doin-challenge 参加表明の簡略版）。
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { isValidPrefecture } from "../core/prefectures.js";
import { getEventById } from "../db/queries.js";
import {
  getMyParticipationForEvent,
  listParticipationsByEvent,
  softDeleteParticipation,
  upsertParticipation,
} from "../db/participation-queries.js";
import { resolveUserParticipationProfile } from "../core/participation-profile.js";

export const eventParticipationRouter = router({
  /** イベントの参加表明一覧。未ログインでも閲覧可。 */
  listByEvent: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return listParticipationsByEvent(db, input.eventId);
    }),

  /** 自分の参加表明（ログイン時のみ）。 */
  mineForEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      return getMyParticipationForEvent(db, input.eventId, ctx.user.id);
    }),

  /** 参加表明する（1イベント1ユーザー）。 */
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        message: z.string().max(500).optional(),
        prefecture: z.string().max(32).optional(),
        companionCount: z.number().int().min(0).max(20).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });

      const ev = await getEventById(db, input.eventId);
      if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "イベントが見つかりません" });
      if (ev.status === "canceled" || ev.status === "ended") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "この集まりは参加表明を受け付けていません" });
      }

      if (input.prefecture && !isValidPrefecture(input.prefecture)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "都道府県を正しく選んでください" });
      }

      const prefecture =
        input.prefecture ?? ctx.user.prefecture ?? ev.prefecture ?? null;

      if (ev.locationType === "offline" && !prefecture) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "リアル開催の参加表明には都道府県が必要です",
        });
      }

      const profile = await resolveUserParticipationProfile(db, ctx.user);

      const row = await upsertParticipation(db, {
        eventId: input.eventId,
        userId: ctx.user.id,
        displayName: profile.displayName,
        username: profile.username,
        profileImage: profile.profileImage,
        message: input.message?.trim() || null,
        prefecture,
        companionCount: input.companionCount,
      });

      return row;
    }),

  /** 参加表明を取り消す。 */
  cancel: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const ok = await softDeleteParticipation(db, input.eventId, ctx.user.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "参加表明が見つかりません" });
      return { ok: true };
    }),
});
