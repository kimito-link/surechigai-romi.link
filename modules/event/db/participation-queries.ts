/**
 * event_participations テーブルへの Drizzle クエリ層。
 */

import { and, eq, inArray, isNull, desc, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import {
  eventParticipations,
  type InsertEventParticipation,
  type EventParticipation,
} from "../../../drizzle/schema/event-participation.js";

type DB = PostgresJsDatabase<typeof schema>;

export type ParticipationPublicView = {
  id: number;
  eventId: number;
  userId: number;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  prefecture: string | null;
  companionCount: number;
  createdAt: Date;
};

function toPublicView(row: EventParticipation): ParticipationPublicView {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    displayName: row.displayName,
    username: row.username,
    profileImage: row.profileImage,
    message: row.message,
    prefecture: row.prefecture,
    companionCount: row.companionCount,
    createdAt: row.createdAt,
  };
}

/** イベントの参加表明一覧（削除済み除く）。 */
export async function listParticipationsByEvent(
  db: DB,
  eventId: number,
  limit = 100,
): Promise<ParticipationPublicView[]> {
  const rows = await db
    .select()
    .from(eventParticipations)
    .where(and(eq(eventParticipations.eventId, eventId), isNull(eventParticipations.deletedAt)))
    .orderBy(desc(eventParticipations.createdAt))
    .limit(limit);
  return rows.map(toPublicView);
}

/** 自分の有効な参加表明（1イベント1件）。 */
export async function getMyParticipationForEvent(
  db: DB,
  eventId: number,
  userId: number,
): Promise<ParticipationPublicView | null> {
  const rows = await db
    .select()
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, eventId),
        eq(eventParticipations.userId, userId),
        isNull(eventParticipations.deletedAt),
      ),
    )
    .limit(1);
  return rows[0] ? toPublicView(rows[0]) : null;
}

/** 複数イベントの参加人数＋先頭アバター（一覧カード用）。 */
export async function getParticipationSummaries(
  db: DB,
  eventIds: number[],
): Promise<
  Map<number, { count: number; avatars: (string | null)[] }>
> {
  const result = new Map<number, { count: number; avatars: (string | null)[] }>();
  if (eventIds.length === 0) return result;

  const countRows = await db
    .select({
      eventId: eventParticipations.eventId,
      count: sql<number>`count(*)::int`,
    })
    .from(eventParticipations)
    .where(
      and(
        inArray(eventParticipations.eventId, eventIds),
        isNull(eventParticipations.deletedAt),
      ),
    )
    .groupBy(eventParticipations.eventId);

  for (const row of countRows) {
    result.set(row.eventId, { count: Number(row.count), avatars: [] });
  }

  const avatarRows = await db
    .select({
      eventId: eventParticipations.eventId,
      profileImage: eventParticipations.profileImage,
    })
    .from(eventParticipations)
    .where(
      and(
        inArray(eventParticipations.eventId, eventIds),
        isNull(eventParticipations.deletedAt),
      ),
    )
    .orderBy(desc(eventParticipations.createdAt));

  const avatarBuckets = new Map<number, (string | null)[]>();
  for (const row of avatarRows) {
    const bucket = avatarBuckets.get(row.eventId) ?? [];
    if (bucket.length < 5) bucket.push(row.profileImage);
    avatarBuckets.set(row.eventId, bucket);
  }

  for (const [eventId, avatars] of avatarBuckets) {
    const existing = result.get(eventId) ?? { count: avatars.length, avatars: [] };
    result.set(eventId, { ...existing, avatars });
  }

  return result;
}

/** 参加表明を登録。既存があれば更新（復活）。 */
export async function upsertParticipation(
  db: DB,
  values: Omit<InsertEventParticipation, "id" | "createdAt" | "deletedAt">,
): Promise<ParticipationPublicView> {
  const existing = await db
    .select()
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, values.eventId),
        eq(eventParticipations.userId, values.userId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const rows = await db
      .update(eventParticipations)
      .set({
        displayName: values.displayName,
        username: values.username ?? null,
        profileImage: values.profileImage ?? null,
        message: values.message ?? null,
        prefecture: values.prefecture ?? null,
        companionCount: values.companionCount ?? 0,
        deletedAt: null,
      })
      .where(eq(eventParticipations.id, existing[0].id))
      .returning();
    return toPublicView(rows[0]);
  }

  const rows = await db.insert(eventParticipations).values(values).returning();
  return toPublicView(rows[0]);
}

/** 参加表明をソフト削除。 */
export async function softDeleteParticipation(
  db: DB,
  eventId: number,
  userId: number,
): Promise<boolean> {
  const rows = await db
    .update(eventParticipations)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(eventParticipations.eventId, eventId),
        eq(eventParticipations.userId, userId),
        isNull(eventParticipations.deletedAt),
      ),
    )
    .returning({ id: eventParticipations.id });
  return rows.length > 0;
}
