/**
 * Self-hosted sponsor cards.
 *
 * P0 scope: one check-in completion slot, no SDKs, no direct user messaging.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, count, desc, eq, gte, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb, requireDb } from "../db/connection.js";
import {
  adStatsDaily,
  adUserDailyCaps,
  locations,
  sponsorCards,
  sponsorConfig,
  users,
  type SponsorCard,
  type SponsorSlot,
  type SponsorSlotFlags,
} from "../../drizzle/schema/index.js";

const SPONSOR_SLOTS = ["checkin_complete", "zukan_feed", "mypage_stats"] as const;
const AD_EVENTS = ["impression", "click"] as const;
const NEW_USER_PROTECTION_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_CHECKINS_FOR_ADS = 10;
const FALLBACK_DAILY_CAP = 3;

type SponsorCardDto = {
  id: number;
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  prefecture: string | null;
  municipality: string | null;
  sponsorLabel: "協賛" | "お知らせ";
};

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function isSlotEnabled(flags: SponsorSlotFlags | null | undefined, slot: SponsorSlot): boolean {
  return flags?.[slot] !== false;
}

function toCardDto(card: SponsorCard): SponsorCardDto {
  return {
    id: card.id,
    title: card.title,
    body: card.body,
    imageUrl: card.imageUrl,
    linkUrl: card.linkUrl,
    prefecture: card.prefecture,
    municipality: card.municipality,
    // 自社機能の宣伝に第三者スポンサーの明示ラベル「協賛」を出すのは景表法上不正確なため、
    // isSelfPromo で出し分ける（自社=お知らせ、第三者スポンサー=協賛）。
    sponsorLabel: card.isSelfPromo ? "お知らせ" : "協賛",
  };
}

function pickWeighted(cards: SponsorCard[]): SponsorCard | null {
  const eligible = cards.filter((card) => card.weight > 0);
  if (eligible.length === 0) return cards[0] ?? null;

  const total = eligible.reduce((sum, card) => sum + card.weight, 0);
  let cursor = Math.random() * total;
  for (const card of eligible) {
    cursor -= card.weight;
    if (cursor <= 0) return card;
  }
  return eligible[eligible.length - 1] ?? null;
}

async function getUserCheckinCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rows = await db
    .select({ total: count() })
    .from(locations)
    .where(and(eq(locations.userId, userId), isNull(locations.deletedAt)));

  return Number(rows[0]?.total ?? 0);
}

async function shouldProtectUser(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;

  const userRows = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const createdAt = userRows[0]?.createdAt;
  const isWithinProtectionWindow =
    !createdAt || Date.now() - createdAt.getTime() < NEW_USER_PROTECTION_MS;
  if (isWithinProtectionWindow) return true;

  const totalCheckins = await getUserCheckinCount(userId);
  return totalCheckins < MIN_CHECKINS_FOR_ADS;
}

async function getTodayUserImpressions(userId: number, date: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rows = await db
    .select({ impressions: adUserDailyCaps.impressions })
    .from(adUserDailyCaps)
    .where(and(eq(adUserDailyCaps.userId, userId), eq(adUserDailyCaps.statDate, date)))
    .limit(1);

  return rows[0]?.impressions ?? 0;
}

async function incrementUserDailyImpression(userId: number, date: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(adUserDailyCaps)
    .values({
      userId,
      statDate: date,
      impressions: 1,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [adUserDailyCaps.userId, adUserDailyCaps.statDate],
      set: {
        impressions: sql`${adUserDailyCaps.impressions} + 1`,
        updatedAt: new Date(),
      },
    });
}

async function incrementCardDailyStat(
  cardId: number,
  date: string,
  event: (typeof AD_EVENTS)[number],
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const set =
    event === "click"
      ? {
          clicks: sql`${adStatsDaily.clicks} + 1`,
          updatedAt: new Date(),
        }
      : {
          impressions: sql`${adStatsDaily.impressions} + 1`,
          updatedAt: new Date(),
        };

  await db
    .insert(adStatsDaily)
    .values({
      cardId,
      statDate: date,
      impressions: event === "impression" ? 1 : 0,
      clicks: event === "click" ? 1 : 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [adStatsDaily.cardId, adStatsDaily.statDate],
      set,
    });
}

export const adsRouter = router({
  getCards: protectedProcedure
    .input(
      z.object({
        slot: z.enum(SPONSOR_SLOTS),
        prefecture: z.string().max(32).nullable().optional(),
        municipality: z.string().max(120).nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return { cards: [] as SponsorCardDto[], dailyCap: FALLBACK_DAILY_CAP, remainingToday: 0 };
      }

      try {
        const configRows = await db.select().from(sponsorConfig).where(eq(sponsorConfig.id, 1)).limit(1);
        const config = configRows[0] ?? {
          enabled: true,
          slotFlags: { checkin_complete: true },
          dailyCap: FALLBACK_DAILY_CAP,
        };
        const dailyCap = Math.max(0, Number(config.dailyCap ?? FALLBACK_DAILY_CAP));

        if (!config.enabled || !isSlotEnabled(config.slotFlags, input.slot) || dailyCap <= 0) {
          return { cards: [] as SponsorCardDto[], dailyCap, remainingToday: 0 };
        }

        if (await shouldProtectUser(ctx.user.id)) {
          return { cards: [] as SponsorCardDto[], dailyCap, remainingToday: 0 };
        }

        const date = todayKey();
        const currentImpressions = await getTodayUserImpressions(ctx.user.id, date);
        if (currentImpressions >= dailyCap) {
          return { cards: [] as SponsorCardDto[], dailyCap, remainingToday: 0 };
        }

        const now = new Date();
        const filters: SQL[] = [
          eq(sponsorCards.active, true),
          lte(sponsorCards.startsAt, now),
        ];
        const endFilter = or(isNull(sponsorCards.endsAt), gte(sponsorCards.endsAt, now));
        if (endFilter) filters.push(endFilter);

        const prefFilter = input.prefecture
          ? or(isNull(sponsorCards.prefecture), eq(sponsorCards.prefecture, input.prefecture))
          : isNull(sponsorCards.prefecture);
        if (prefFilter) filters.push(prefFilter);

        const municipalityFilter = input.municipality
          ? or(isNull(sponsorCards.municipality), eq(sponsorCards.municipality, input.municipality))
          : isNull(sponsorCards.municipality);
        if (municipalityFilter) filters.push(municipalityFilter);

        const candidates = await db
          .select()
          .from(sponsorCards)
          .where(and(...filters))
          .orderBy(desc(sponsorCards.weight), desc(sponsorCards.updatedAt))
          .limit(20);

        const picked = pickWeighted(candidates);
        if (!picked) {
          return {
            cards: [] as SponsorCardDto[],
            dailyCap,
            remainingToday: Math.max(0, dailyCap - currentImpressions),
          };
        }

        await incrementUserDailyImpression(ctx.user.id, date);
        await incrementCardDailyStat(picked.id, date, "impression");

        return {
          cards: [toCardDto(picked)],
          dailyCap,
          remainingToday: Math.max(0, dailyCap - currentImpressions - 1),
        };
      } catch (error) {
        console.warn("[ads.getCards] failed:", error);
        return { cards: [] as SponsorCardDto[], dailyCap: FALLBACK_DAILY_CAP, remainingToday: 0 };
      }
    }),

  track: protectedProcedure
    .input(
      z.object({
        cardId: z.number().int().positive(),
        event: z.enum(AD_EVENTS),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      try {
        await incrementCardDailyStat(input.cardId, todayKey(), input.event);
        return { ok: true };
      } catch (error) {
        console.warn("[ads.track] failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "広告イベントの記録に失敗しました",
        });
      }
    }),
});
