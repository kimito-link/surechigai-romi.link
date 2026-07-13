/**
 * マイページ / ダッシュボード用の集計クエリ。
 */

import { and, eq, isNull, or, sql, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import { locations, encounters, visitedAreas, blocks } from "../../../drizzle/schema/index.js";
import { events } from "../../../drizzle/schema/event.js";
import {
  getDistinctEncounterPartnerCount,
  getMyTrailLocations,
} from "./queries.js";
import {
  getParticipationSummaries,
  listMyUpcomingParticipations,
} from "../../event/db/participation-queries.js";

type DB = PostgresJsDatabase<typeof schema>;

export type MySignalSummary = {
  trailCount: number;
  latestPlaceLabel: string | null;
  latestRecordedAt: Date | null;
  latestLocation: { lat: number; lng: number; accuracyM: number | null } | null;
  encounterPartnerCount: number;
  unopenedCount: number;
  visitedPrefectureCount: number;
  visitedAreaCount: number;
  checkedInToday: boolean;
  upcomingParticipationCount: number;
  hostEvents: {
    id: number;
    title: string;
    startAt: Date;
    status: string;
    participantCount: number;
    participantAvatars: (string | null)[];
  }[];
};

function placeLabel(municipality: string | null, prefecture: string | null): string | null {
  const label = [prefecture, municipality].filter(Boolean).join(" ");
  return label || null;
}

export async function getUnopenedEncounterCount(db: DB, selfUserId: number): Promise<number> {
  const blockRows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, selfUserId), eq(blocks.blockedId, selfUserId)));
  const blockedSet = new Set<number>();
  for (const r of blockRows) {
    blockedSet.add(r.blockerId === selfUserId ? r.blockedId : r.blockerId);
  }

  const rows = await db
    .select({
      id: encounters.id,
      userAId: encounters.userAId,
      userBId: encounters.userBId,
      openedByA: encounters.openedByA,
      openedByB: encounters.openedByB,
    })
    .from(encounters)
    .where(or(eq(encounters.userAId, selfUserId), eq(encounters.userBId, selfUserId)));

  let count = 0;
  for (const row of rows) {
    const partnerId = row.userAId === selfUserId ? row.userBId : row.userAId;
    if (blockedSet.has(partnerId)) continue;
    const opened =
      row.userAId === selfUserId ? row.openedByA != null : row.openedByB != null;
    if (!opened) count += 1;
  }
  return count;
}

export async function getTrailCount(db: DB, selfUserId: number): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(locations)
    .where(
      and(
        eq(locations.userId, selfUserId),
        isNull(locations.deletedAt),
        sql`${locations.lat} IS NOT NULL`,
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

export async function getVisitedAreaStats(
  db: DB,
  selfUserId: number,
): Promise<{ prefectureCount: number; areaCount: number }> {
  const rows = await db
    .select({
      prefecture: visitedAreas.prefecture,
    })
    .from(visitedAreas)
    .where(eq(visitedAreas.userId, selfUserId));

  const prefectures = new Set(rows.map((r) => r.prefecture).filter(Boolean));
  return { prefectureCount: prefectures.size, areaCount: rows.length };
}

export async function getMySignalSummary(db: DB, selfUserId: number): Promise<MySignalSummary> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const [
    trailCount,
    latestTrail,
    encounterPartnerCount,
    unopenedCount,
    visitedStats,
    upcoming,
    myEvents,
  ] = await Promise.all([
    getTrailCount(db, selfUserId),
    getMyTrailLocations(db, selfUserId, 1),
    getDistinctEncounterPartnerCount(db, selfUserId),
    getUnopenedEncounterCount(db, selfUserId),
    getVisitedAreaStats(db, selfUserId),
    listMyUpcomingParticipations(db, selfUserId, now, 20),
    db
      .select({ id: events.id, title: events.title, startAt: events.startAt, status: events.status })
      .from(events)
      .where(
        and(
          eq(events.creatorId, selfUserId),
          sql`${events.status} NOT IN ('ended','canceled')`,
        ),
      )
      .orderBy(desc(events.startAt))
      .limit(5),
  ]);

  const latest = latestTrail[0];
  const latestRecordedAt = latest?.recordedAt ?? null;
  const checkedInToday =
    latestRecordedAt != null && new Date(latestRecordedAt).getTime() >= dayStart.getTime();

  const eventIds = myEvents.map((e) => e.id);
  const participationSummaries = await getParticipationSummaries(db, eventIds);

  const hostEvents = myEvents.map((e) => {
    const summary = participationSummaries.get(e.id);
    return {
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      status: e.status,
      participantCount: summary?.count ?? 0,
      participantAvatars: summary?.avatars ?? [],
    };
  });

  return {
    trailCount,
    latestPlaceLabel: latest
      ? placeLabel(latest.municipality, latest.prefecture)
      : null,
    latestRecordedAt,
    latestLocation: latest
      ? { lat: latest.lat, lng: latest.lng, accuracyM: latest.accuracyM }
      : null,
    encounterPartnerCount,
    unopenedCount,
    visitedPrefectureCount: visitedStats.prefectureCount,
    visitedAreaCount: visitedStats.areaCount,
    checkedInToday,
    upcomingParticipationCount: upcoming.length,
    hostEvents,
  };
}
