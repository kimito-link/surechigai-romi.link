/**
 * modules/event/api/event.ts
 *
 * event tRPC ルーター。「予定(カレンダー)」と「今ここにいるよ(ライブ表明)」を
 * 単一の events エンティティで扱う（会議の合意設計）。
 *
 * - event.create        : イベント作成（予定）
 * - event.listUpcoming  : 公開イベントの予定一覧（カレンダー）
 * - event.listLive      : 今ライブ中の公開イベント（在席マップ）
 * - event.countByPref   : 県ごとの件数（在席マップのグリッド）
 * - event.listMine      : 自分の主催イベント
 * - event.goLive        : ライブ表明（今やってる）
 * - event.endLive       : 終了
 * - event.cancel        : キャンセル
 * - event.reveal        : unlisted の会場/URL を合言葉で開示
 *
 * 非対称マスク: creator 情報は常に公開。offline の venueName / online の onlineUrl は
 * unlisted の場合 reveal（合言葉一致）まで返さない。
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { isValidPrefecture } from "../core/prefectures.js";
import { serializeTypeTags, parseTypeTags } from "../core/status.js";
import { hashAccessCode, verifyAccessCode } from "../core/access.js";
import type { Event } from "../../../drizzle/schema/event.js";
import {
  insertEvent,
  getEventById,
  listUpcomingPublic,
  listLivePublic,
  countByPrefecture,
  listMyEvents,
  updateEventStatus,
} from "../db/queries.js";

/** openId "twitter:12345" から X 数値ID "12345" を取り出す。それ以外は null。 */
function extractXId(openId: string | null | undefined): string | null {
  if (!openId) return null;
  const m = /^twitter:(.+)$/.exec(openId);
  return m ? m[1] : null;
}

/** 公開一覧で返す形。unlisted の秘匿フィールドは落とす。 */
function toPublicView(e: Event) {
  const isUnlisted = e.visibility === "unlisted";
  return {
    id: e.id,
    creatorId: e.creatorId,
    creatorName: e.creatorName,
    creatorXId: e.creatorXId,
    // X送客リンク（DM禁止＝交流はXへ委譲、の導線）。creatorXId があれば組み立てる。
    creatorXUrl: e.creatorXId ? `https://x.com/i/user/${e.creatorXId}` : null,
    title: e.title,
    description: e.description,
    typeTags: parseTypeTags(e.typeTags),
    locationType: e.locationType,
    prefecture: e.prefecture,
    // 非対称マスク: unlisted は会場名/URLを隠す（reveal で別途開示）
    venueName: isUnlisted ? null : e.venueName,
    onlineUrl: isUnlisted ? null : e.onlineUrl,
    startAt: e.startAt,
    endAt: e.endAt,
    status: e.status,
    liveCheckinAt: e.liveCheckinAt,
    visibility: e.visibility,
    hasAccessCode: e.accessCodeHash != null,
  };
}

export const eventRouter = router({
  /** イベント作成（＝予定をカレンダーに置く）。 */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(80),
        description: z.string().max(2000).optional(),
        typeTags: z.array(z.string().max(24)).max(8).optional(),
        locationType: z.enum(["online", "offline"]),
        prefecture: z.string().max(32).optional(),
        venueName: z.string().max(120).optional(),
        onlineUrl: z.string().url().max(2000).optional(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime().optional(),
        visibility: z.enum(["public", "unlisted"]).default("public"),
        accessCode: z.string().min(1).max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // --- 場所バリデーション（詐称防止） ---
      if (input.locationType === "offline") {
        if (!isValidPrefecture(input.prefecture)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "リアル開催は47都道府県から選んでください",
          });
        }
      } else {
        if (!input.onlineUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "オンライン開催は配信/通話URLが必要です",
          });
        }
      }

      // --- 限定イベントは合言葉必須 ---
      let accessCodeHash: string | null = null;
      if (input.visibility === "unlisted") {
        if (!input.accessCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "限定イベントには合言葉が必要です",
          });
        }
        accessCodeHash = await hashAccessCode(input.accessCode);
      }

      const start = new Date(input.startAt);
      const end = input.endAt ? new Date(input.endAt) : null;
      if (end && end.getTime() <= start.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "終了時刻は開始時刻より後にしてください",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });

      const created = await insertEvent(db, {
        creatorId: ctx.user.id,
        creatorName: ctx.user.name ?? null,
        creatorXId: extractXId(ctx.user.openId),
        title: input.title,
        description: input.description ?? null,
        typeTags: serializeTypeTags(input.typeTags ?? []),
        locationType: input.locationType,
        prefecture: input.locationType === "offline" ? input.prefecture! : null,
        venueName: input.venueName ?? null,
        onlineUrl: input.locationType === "online" ? input.onlineUrl! : null,
        startAt: start,
        endAt: end,
        status: "upcoming",
        liveCheckinAt: null,
        visibility: input.visibility,
        accessCodeHash,
      });

      return { id: created.id };
    }),

  /** 公開イベントの予定一覧（カレンダー）。未ログインでも閲覧可。 */
  listUpcoming: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await listUpcomingPublic(db, new Date(), input?.limit ?? 50);
      return rows.map(toPublicView);
    }),

  /** 今ライブ中の公開イベント（在席マップ）。県で絞り込み可。未ログインでも閲覧可。 */
  listLive: publicProcedure
    .input(z.object({ prefecture: z.string().max(32).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await listLivePublic(db, new Date(), input?.prefecture);
      return rows.map(toPublicView);
    }),

  /** 県ごとの公開イベント件数（在席マップのグリッド）。 */
  countByPref: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return countByPrefecture(db, new Date());
  }),

  /** 自分が主催するイベント一覧。 */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await listMyEvents(db, ctx.user.id);
    // 自分のものは秘匿フィールドも含めて返す
    return rows.map((e) => ({
      ...toPublicView(e),
      venueName: e.venueName,
      onlineUrl: e.onlineUrl,
    }));
  }),

  /** ライブ表明（今やってる）。本人のみ。即 status=live → 在席マップに出る。 */
  goLive: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const ok = await updateEventStatus(db, {
        id: input.eventId,
        creatorId: ctx.user.id,
        status: "live",
        liveCheckinAt: new Date(),
      });
      if (!ok) throw new TRPCError({ code: "FORBIDDEN", message: "本人のイベントのみ表明できます" });
      return { ok: true };
    }),

  /** 終了。本人のみ。 */
  endLive: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const ok = await updateEventStatus(db, {
        id: input.eventId,
        creatorId: ctx.user.id,
        status: "ended",
      });
      if (!ok) throw new TRPCError({ code: "FORBIDDEN", message: "本人のイベントのみ操作できます" });
      return { ok: true };
    }),

  /** キャンセル。本人のみ。 */
  cancel: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const ok = await updateEventStatus(db, {
        id: input.eventId,
        creatorId: ctx.user.id,
        status: "canceled",
      });
      if (!ok) throw new TRPCError({ code: "FORBIDDEN", message: "本人のイベントのみ操作できます" });
      return { ok: true };
    }),

  /**
   * 限定イベントの会場/URLを合言葉で開示する。
   * 合言葉が一致した場合のみ venueName / onlineUrl を返す（非対称マスクの解除）。
   */
  reveal: protectedProcedure
    .input(z.object({ eventId: z.number(), accessCode: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });

      const ev = await getEventById(db, input.eventId);
      if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "イベントが見つかりません" });

      if (ev.visibility !== "unlisted") {
        // public はそもそもマスクしていない
        return { venueName: ev.venueName, onlineUrl: ev.onlineUrl };
      }

      const passed = await verifyAccessCode(input.accessCode, ev.accessCodeHash);
      if (!passed) {
        throw new TRPCError({ code: "FORBIDDEN", message: "合言葉が違います" });
      }
      return { venueName: ev.venueName, onlineUrl: ev.onlineUrl };
    }),
});
