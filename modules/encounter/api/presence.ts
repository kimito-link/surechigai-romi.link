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
import { getDb } from "../../../server/db/connection.js";
import {
  getUserSettings,
  upsertUserSettings,
  updateLivePresencePosition,
  listLivePresenceForViewer,
} from "../db/queries.js";
import { assertFiniteLatLng } from "../core/geo.js";
import { LIVE_PRESENCE_MIN_PULSE_GAP_MS } from "../core/live-presence.js";

const RECENT_PULSE_CACHE_MAX = 5_000;
const RECENT_PULSE_CACHE_TTL_MS = 10 * 60 * 1000;

const recentPulseAtByUserId = new Map<number, number>();

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
      const db = await getDb();
      if (!db) return { ok: true, enabled: input.enabled };

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
        return { ok: true, masked: false };
      }

      const db = await getDb();
      if (!db) return { ok: false, masked: false };

      return updateLivePresencePosition(db, ctx.user.id, {
        lat: latLng.lat,
        lng: latLng.lng,
        municipality: normalizePlace(input.municipality),
        prefecture: normalizePlace(input.prefecture),
      });
    }),

  /** レーダー上に表示する居場所（最大5分以内の更新） */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return listLivePresenceForViewer(db, ctx.user.id);
  }),
});
