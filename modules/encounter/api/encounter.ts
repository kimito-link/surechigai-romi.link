/**
 * modules/encounter/api/encounter.ts
 *
 * encounter tRPC ルーター。
 * - encounter.checkIn
 * - encounter.list
 * - encounter.open
 * - encounter.react
 * - encounter.updateHitokoto
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../../server/_core/trpc.js";
import { getDb, requireDb } from "../../../server/db/connection.js";
import {
  toGrid,
  toH3Cell,
  toH3R7,
  toH3ParentCell,
  assertFiniteLatLng,
  H3_RES_7,
  H3_RES_5,
} from "../core/geo.js";
import { findMatches } from "../core/matching.js";
import { moderateText } from "../core/moderation.js";
import { reverseGeocodeWithTimeout } from "../core/geocoding.js";
import {
  isAcceptableAccuracy,
  isLocationRecordingPaused,
  resolveMunicipality,
  excludeSelfMatches,
} from "../core/checkin-guards.js";
import { reactions, users } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import {
  insertLocation,
  getNearCandidates,
  getWideCandidates,
  getTimeshiftCandidates,
  getBlockSet,
  getTodayPairSet,
  insertEncountersIfNew,
  upsertVisitedArea,
  getMyEncounters,
  openEncounter,
  isEncounterParty,
  getUserSettings,
  upsertUserSettings,
  getMostFrequentNightH3R8,
} from "../db/queries.js";

export const encounterRouter = router({
  /**
   * チェックイン。唯一の位置送信口。
   * accuracy > 10000 は拒否。位置一時停止中は無視。
   * サーバーで即 h3 丸め。オンデマンドマッチング実行。
   */
  checkIn: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
        municipality: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // accuracy チェック
      if (!isAcceptableAccuracy(input.accuracy)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "位置精度が低すぎます (accuracy > 10000m)",
        });
      }

      // lat/lng バリデーション
      const latLng = assertFiniteLatLng(input.lat, input.lng);
      if (!latLng) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "無効な座標です" });
      }

      const db = await getDb();
      if (!db) {
        // DB未接続を「成功形(saved欠落)」で返すと足あと未保存のまま完了UIになる(P0-1)。
        // "Database not available" はクライアント toUserFriendlyError が
        // DATABASE_NOT_AVAILABLE(再試行可)に写す既知文言。
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { latGrid, lngGrid } = toGrid(latLng.lat, latLng.lng);
      const h3R8 = toH3Cell(latGrid, lngGrid, 8);
      // visitedAreas.h3R7（タイムシフト・直接計算）専用。候補絞り込み用ではない。
      const h3R7 = toH3R7(latGrid, lngGrid);
      // locations.h3R7 / h3R5（候補絞り込み専用。h3R8からのcellToParent由来で上記h3R7とは別値）
      const candidateH3R7 = toH3ParentCell(h3R8, H3_RES_7);
      const candidateH3R5 = toH3ParentCell(h3R8, H3_RES_5);

      const [settings, g] = await Promise.all([
        getUserSettings(db, userId),
        reverseGeocodeWithTimeout(latLng.lat, latLng.lng, 2_500),
      ]);
      if (isLocationRecordingPaused(settings?.locationPausedUntil)) {
        // 一時停止中の無言成功はキャッシュずれ経由のチェックインを「保存済み」と誤認させる(P1-3)。
        // 明示エラーで返し、クライアントはこの文言をそのまま表示する。
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "位置記録は一時停止中です。マイページで「灯を消す」を解除してからお試しください",
        });
      }

      let municipality = resolveMunicipality(input.municipality, g.municipality);
      const prefecture = g.prefecture;
      const areaName = g.areaName;
      const address = g.address;

      let locationId: number;
      try {
        const [insertedId] = await Promise.all([
          insertLocation(db, {
            userId,
            h3R8,
            latGrid,
            lngGrid,
            lat: latLng.lat,
            lng: latLng.lng,
            accuracyM: input.accuracy ?? null,
            municipality,
            prefecture,
            address,
          }),
          upsertVisitedArea(db, {
            userId,
            h3R7,
            municipality,
            prefecture,
          }),
        ]);
        locationId = insertedId;
      } catch (insertErr) {
        console.error("[encounter.checkIn] location insert failed:", insertErr);
        return {
          newEncounters: 0,
          prefecture,
          municipality,
          areaName,
          address,
          lat: latLng.lat,
          lng: latLng.lng,
          locationId: null,
          saved: false,
        };
      }

      getMostFrequentNightH3R8(db, userId).then((cell) => {
        upsertUserSettings(db, userId, { homeMaskCell: cell }).catch(() => {});
      }).catch(() => {});

      let nearCandidates: Awaited<ReturnType<typeof getNearCandidates>> = [];
      let timeshiftCandidates: Awaited<ReturnType<typeof getTimeshiftCandidates>> = [];
      let blockSet = new Set<string>();
      let todayPairSet = new Set<string>();
      try {
        [nearCandidates, timeshiftCandidates, blockSet, todayPairSet] = await Promise.all([
          getNearCandidates(db, userId, candidateH3R7),
          getTimeshiftCandidates(db, userId, h3R7),
          getBlockSet(db, userId),
          getTodayPairSet(db, userId),
        ]);
      } catch (matchErr) {
        console.error("[encounter.checkIn] matching/block query failed:", matchErr);
      }

      const selfLocation = {
        userId,
        latGrid,
        lngGrid,
        h3R8,
        recordedAt: new Date(),
      };

      const immediateMatches = excludeSelfMatches(
        findMatches({
          self: selfLocation,
          nearbyCandidates: nearCandidates,
          timeshiftCandidates,
          blockSet,
          todayPairSet,
        }),
      );

      // 過疎地対策ゲート: 近距離(Tier1-2)でマッチ0件 かつ 当日まだ1件もマッチしていない
      // ユーザーだけ、広域(Tier3-4)ステージを追加実行する。
      // 移植元設計: docs/matching-tier-redesign-DESIGN.md §3.1（旧surechigai-nicoの
      // 「直近24hマッチ0件のユーザーだけ範囲拡大」を、追加クエリ最小の同期処理に適合）
      let matchResults = immediateMatches;
      if (immediateMatches.length === 0 && todayPairSet.size === 0) {
        try {
          const wideCandidates = await getWideCandidates(db, userId, candidateH3R5);
          matchResults = excludeSelfMatches(
            findMatches({
              self: selfLocation,
              nearbyCandidates: [...nearCandidates, ...wideCandidates],
              timeshiftCandidates,
              blockSet,
              todayPairSet,
            }),
          );
        } catch (wideErr) {
          console.error("[encounter.checkIn] wide-stage matching query failed:", wideErr);
        }
      }

      // encounters INSERT（UNIQUE衝突は無視・1クエリでバルク挿入）
      // 旧実装はマッチ件数分だけ逐次 await insertEncounterIfNew するN+1ループだった
      // （Vercel⇄Railwayレイテンシ調査 2026-07-23 で発見）。
      let newEncounters = 0;
      if (matchResults.length > 0) {
        try {
          newEncounters = await insertEncountersIfNew(
            db,
            matchResults.map((m) => ({
              userAId: m.userAId,
              userBId: m.userBId,
              tier: m.tier,
              h3R7: m.h3R7,
              areaName,
              prefecture,
              occurredAt: m.occurredAt,
            })),
          );
        } catch (insertErr) {
          console.error("[encounter.checkIn] insertEncounters failed:", insertErr);
        }
      }

      // saved:true は「足あとの永続化が確定した」の明示。クライアントは saved !== true を全て失敗扱いにする(肯定形判定)
      return { newEncounters, prefecture, municipality, areaName, address, lat: latLng.lat, lng: latLng.lng, locationId, saved: true };
    }),

  /**
   * 封筒一覧。ブロック相手・停止ユーザー除外。
   * cursor = occurredAt ISO文字列（ページング）。
   */
  list: protectedProcedure
    .input(z.object({ cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const items = await getMyEncounters(db, ctx.user.id, input.cursor);

      // 24h以内のひとことのみ返す
      const now = new Date();
      return items.map((item) => {
        const hitokotoAge = item.partnerHitokotoUpdatedAt
          ? now.getTime() - item.partnerHitokotoUpdatedAt.getTime()
          : Infinity;
        return {
          ...item,
          partnerHitokoto:
            hitokotoAge < 24 * 60 * 60 * 1000 ? item.partnerHitokoto : null,
        };
      });
    }),

  /**
   * 開封（自分側の openedByX を now に）。
   */
  open: protectedProcedure
    .input(z.object({ encounterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await openEncounter(db, ctx.user.id, input.encounterId);
      if (result === "not_found") {
        throw new TRPCError({ code: "NOT_FOUND", message: "すれ違いが見つかりません" });
      }
      if (result === "forbidden") {
        throw new TRPCError({ code: "FORBIDDEN", message: "このすれ違いを開封する権限がありません" });
      }
      return { ok: true };
    }),

  /**
   * 一方向リアクション（1すれ違い1回）。
   */
  react: protectedProcedure
    .input(z.object({ encounterId: z.number(), emoji: z.string().max(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      const isParty = await isEncounterParty(db, input.encounterId, ctx.user.id);
      if (!isParty) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "すれ違いが見つからないか、リアクションする権限がありません",
        });
      }

      await db
        .insert(reactions)
        .values({
          encounterId: input.encounterId,
          senderId: ctx.user.id,
          emoji: input.emoji,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [reactions.encounterId, reactions.senderId],
          set: { emoji: input.emoji },
        });

      return { ok: true };
    }),

  /**
   * ひとこと更新（NGワードフィルタ通過必須）。
   */
  updateHitokoto: protectedProcedure
    .input(z.object({ text: z.string().max(140) }))
    .mutation(async ({ ctx, input }) => {
      const result = await moderateText(input.text, {
        groqApiKey: process.env.GROQ_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
      });

      if (result.rejected) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `不適切なひとことです (${result.stage})`,
        });
      }

      const db = await requireDb();

      await db
        .update(users)
        .set({ hitokoto: input.text, hitokotoUpdatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { ok: true };
    }),
});
