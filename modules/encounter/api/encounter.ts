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
import { getDb } from "../../../server/db/connection.js";
import { toGrid, toH3Cell, toH3R7, assertFiniteLatLng } from "../core/geo.js";
import { findMatches } from "../core/matching.js";
import { moderateText } from "../core/moderation.js";
import { reverseGeocode } from "../core/geocoding.js";
import { reactions, users } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import {
  insertLocation,
  getNearbyCandidates,
  getTimeshiftCandidates,
  getBlockSet,
  getTodayPairSet,
  insertEncounterIfNew,
  upsertVisitedArea,
  getMyEncounters,
  openEncounter,
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
      if (input.accuracy !== undefined && input.accuracy > 10_000) {
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
      if (!db) return { newEncounters: 0, prefecture: null, municipality: null, areaName: null, address: null, lat: input.lat, lng: input.lng };

      // 位置一時停止チェック
      const settings = await getUserSettings(db, userId);
      if (
        settings?.locationPausedUntil &&
        settings.locationPausedUntil > new Date()
      ) {
        return { newEncounters: 0, prefecture: null, municipality: null, areaName: null, address: null, lat: input.lat, lng: input.lng };
      }

      // 座標を丸める
      const { latGrid, lngGrid } = toGrid(latLng.lat, latLng.lng);
      const h3R8 = toH3Cell(latGrid, lngGrid, 8);
      const h3R7 = toH3R7(latGrid, lngGrid);

      // 逆ジオコーディング（municipality 未指定時のみ非同期補完）
      let municipality = input.municipality ?? null;
      let prefecture: string | null = null;
      let areaName: string | null = null;

      // バックグラウンドで geocode（await しない: チェックインレイテンシを下げる）
      const g = await reverseGeocode(latLng.lat, latLng.lng);
      municipality = municipality ?? g.municipality;
      prefecture = g.prefecture;
      areaName = g.areaName;
      const address = g.address;
      
      await insertLocation(db, {
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
      });
      
      await upsertVisitedArea(db, {
        userId,
        h3R7,
        municipality,
        prefecture,
      });
      
      getMostFrequentNightH3R8(db, userId).then((cell) => {
        upsertUserSettings(db, userId, { homeMaskCell: cell }).catch(() => {});
      }).catch(() => {});

      // マッチング候補取得（失敗してもチェックイン自体は成功させる）
      let nearbyCandidates: Awaited<ReturnType<typeof getNearbyCandidates>> = [];
      let timeshiftCandidates: Awaited<ReturnType<typeof getTimeshiftCandidates>> = [];
      try {
        [nearbyCandidates, timeshiftCandidates] = await Promise.all([
          getNearbyCandidates(db, userId, h3R8),
          getTimeshiftCandidates(db, userId, h3R7),
        ]);
      } catch (matchErr) {
        console.error("[encounter.checkIn] matching candidate query failed:", matchErr);
      }

      const [blockSet, todayPairSet] = await Promise.all([
        getBlockSet(db, userId),
        getTodayPairSet(db, userId),
      ]);

      const selfLocation = {
        userId,
        latGrid,
        lngGrid,
        h3R8,
        recordedAt: new Date(),
      };

      const matchResults = findMatches({
        self: selfLocation,
        nearbyCandidates,
        timeshiftCandidates,
        blockSet,
        todayPairSet,
      });

      // encounters INSERT（UNIQUE衝突は無視）
      let newEncounters = 0;
      for (const m of matchResults) {
        if (m.userAId === m.userBId) continue;
        const inserted = await insertEncounterIfNew(db, {
          userAId: m.userAId,
          userBId: m.userBId,
          tier: m.tier,
          h3R7: m.h3R7,
          areaName,
          prefecture,
          occurredAt: m.occurredAt,
        });
        if (inserted) newEncounters++;
      }

      return { newEncounters, prefecture, municipality, areaName, address, lat: latLng.lat, lng: latLng.lng };
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
      const db = await getDb();
      if (!db) return { ok: true };
      await openEncounter(db, ctx.user.id, input.encounterId);
      return { ok: true };
    }),

  /**
   * 一方向リアクション（1すれ違い1回）。
   */
  react: protectedProcedure
    .input(z.object({ encounterId: z.number(), emoji: z.string().max(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: true };

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

      const db = await getDb();
      if (!db) return { ok: true };

      await db
        .update(users)
        .set({ hitokoto: input.text, hitokotoUpdatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { ok: true };
    }),
});
