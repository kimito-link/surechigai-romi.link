/**
 * modules/encounter/api/presence.ts
 *
 * リアルタイム居場所（レーダー公開）。
 * - presence.setEnabled: 居場所 ON/OFF
 * - presence.pulse: 位置更新（ON 中のみ）
 * - presence.list: レーダーに表示する居場所一覧
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../../server/_core/trpc.js";
import { getDb, requireDb } from "../../../server/db/connection.js";
import {
  getUserSettings,
  upsertUserSettings,
  updateLivePresencePosition,
  listLivePresenceForViewer,
  getUnopenedEncounterSummary,
} from "../db/queries.js";
import { assertFiniteLatLng } from "../core/geo.js";
import { LIVE_PRESENCE_MIN_PULSE_GAP_MS } from "../core/live-presence.js";

const RECENT_PULSE_CACHE_MAX = 5_000;
const RECENT_PULSE_CACHE_TTL_MS = 10 * 60 * 1000;

const recentPulseAtByUserId = new Map<number, number>();

/**
 * 未開封サマリの計算間隔。pulse 自体は60秒ごとに来るが、
 * 毎回 DB を引くとレーダーON のユーザー数だけクエリが増える。
 * ユーザーの許容遅延は「数十分〜数時間」なので10分で十分に速い。
 */
const UNOPENED_SUMMARY_MIN_GAP_MS = 10 * 60 * 1000;
const recentUnopenedSummaryAtByUserId = new Map<number, number>();

/**
 * このユーザーについて未開封サマリを計算してよいか（10分に1回に間引く）。
 *
 * canAcceptPulse と同型の in-memory Map。Vercel の serverless はインスタンス毎に
 * この Map を持つので、worst case では pulse 毎に計算が走りうる。
 * それでも1クエリ・インデックス済みカラムのみに抑えてあるので許容する
 * （既存の recentPulseAtByUserId と同じ既知の限界）。
 */
export function shouldComputeUnopenedSummary(
  userId: number,
  now = Date.now(),
): boolean {
  const lastAt = recentUnopenedSummaryAtByUserId.get(userId);
  if (lastAt !== undefined && now - lastAt < UNOPENED_SUMMARY_MIN_GAP_MS) {
    return false;
  }

  recentUnopenedSummaryAtByUserId.set(userId, now);
  if (recentUnopenedSummaryAtByUserId.size > RECENT_PULSE_CACHE_MAX) {
    const cutoff = now - RECENT_PULSE_CACHE_TTL_MS;
    for (const [cachedUserId, at] of recentUnopenedSummaryAtByUserId) {
      if (at < cutoff) recentUnopenedSummaryAtByUserId.delete(cachedUserId);
    }
  }
  return true;
}

function normalizePlace(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function canAcceptPulse(userId: number, now = Date.now()): boolean {
  const lastAcceptedAt = recentPulseAtByUserId.get(userId);
  if (
    lastAcceptedAt !== undefined &&
    now - lastAcceptedAt < LIVE_PRESENCE_MIN_PULSE_GAP_MS
  ) {
    return false;
  }

  recentPulseAtByUserId.set(userId, now);
  if (recentPulseAtByUserId.size > RECENT_PULSE_CACHE_MAX) {
    const cutoff = now - RECENT_PULSE_CACHE_TTL_MS;
    for (const [cachedUserId, acceptedAt] of recentPulseAtByUserId) {
      if (acceptedAt < cutoff) {
        recentPulseAtByUserId.delete(cachedUserId);
      }
    }
  }
  return true;
}

export const presenceRouter = router({
  /** 居場所のリアルタイム公開を ON/OFF */
  setEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      if (input.enabled) {
        const settings = await getUserSettings(db, ctx.user.id);
        if (
          settings?.locationPausedUntil &&
          settings.locationPausedUntil.getTime() > Date.now()
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "位置情報が一時停止中のため、居場所を公開できません",
          });
        }
      }

      await upsertUserSettings(db, ctx.user.id, {
        livePresenceEnabled: input.enabled,
        ...(input.enabled
          ? {}
          : {
              livePresenceLat: null,
              livePresenceLng: null,
              livePresenceMunicipality: null,
              livePresenceUpdatedAt: null,
            }),
      });

      return { ok: true, enabled: input.enabled };
    }),

  /** ON 中に定期的に呼ぶ位置更新 */
  pulse: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
        municipality: z.string().optional(),
        prefecture: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.accuracy !== undefined && input.accuracy > 10_000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "位置精度が低すぎます",
        });
      }

      const latLng = assertFiniteLatLng(input.lat, input.lng);
      if (!latLng) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "無効な座標です" });
      }

      if (!canAcceptPulse(ctx.user.id)) {
        return { ok: true, masked: false, unopened: null };
      }

      const db = await getDb();
      if (!db) return { ok: false, masked: false, unopened: null };

      try {
        const result = await updateLivePresencePosition(db, ctx.user.id, {
          lat: latLng.lat,
          lng: latLng.lng,
          municipality: normalizePlace(input.municipality),
          prefecture: normalizePlace(input.prefecture),
        });

        // 未開封サマリを相乗りさせる（アプリ内通知の種）。
        // ここで失敗しても pulse 本来の責務（位置更新）を巻き込まない。
        let unopened: { count: number; latestId: number } | null = null;
        if (shouldComputeUnopenedSummary(ctx.user.id)) {
          try {
            const summary = await getUnopenedEncounterSummary(db, ctx.user.id);
            if (summary.latestId != null) {
              unopened = { count: summary.count, latestId: summary.latestId };
            }
          } catch (error) {
            console.error("[presence.pulse] unopened summary failed:", error);
          }
        }

        return { ...result, unopened };
      } catch (error) {
        console.error("[presence.pulse] DB update failed:", error);
        return { ok: false, masked: false, unopened: null };
      }
    }),

  /** レーダー上に表示する居場所（最大5分以内の更新） */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return listLivePresenceForViewer(db, ctx.user.id);
  }),
});
