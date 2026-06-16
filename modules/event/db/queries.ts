/**
 * modules/event/db/queries.ts
 *
 * events テーブルへの Drizzle クエリ層。tRPC ルーターから呼ばれる。
 * DBクライアントを引数で受け取る（encounter モジュールと同じ規約）。
 */

import { and, eq, gte, gt, lt, desc, asc, sql, isNull, or, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema";
import { events } from "../../../drizzle/schema";
import type { InsertEvent, Event } from "../../../drizzle/schema/event.js";

type DB = PostgresJsDatabase<typeof schema>;

/** イベント作成。INSERT した行を返す。 */
export async function insertEvent(db: DB, values: InsertEvent): Promise<Event> {
  const rows = await db.insert(events).values(values).returning();
  return rows[0];
}

/** id でイベント1件取得（オーナー検証・詳細表示用）。 */
export async function getEventById(db: DB, id: number): Promise<Event | null> {
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * 公開イベントのうち、これからの予定（startAt が now 以降、canceled/ended 以外）を取得。
 * カレンダー表示用。unlisted は含めない。
 */
export async function listUpcomingPublic(
  db: DB,
  now: Date,
  limit = 50
): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.visibility, "public"),
        gte(events.startAt, now),
        sql`${events.status} NOT IN ('canceled','ended')`
      )
    )
    .orderBy(asc(events.startAt))
    .limit(limit);
}

/**
 * 「今ライブ中」の公開イベントを取得。在席マップ用。
 * liveCheckinAt が設定済み & status が live & (endAt 未設定 or 未来)。
 * prefecture 指定時はその県に絞る。
 */
export async function listLivePublic(
  db: DB,
  now: Date,
  prefecture?: string,
  limit = 100
): Promise<Event[]> {
  const conds = [
    eq(events.visibility, "public"),
    eq(events.status, "live"),
    sql`${events.liveCheckinAt} IS NOT NULL`,
    or(isNull(events.endAt), gt(events.endAt, now)),
  ];
  if (prefecture) conds.push(eq(events.prefecture, prefecture));

  return db
    .select()
    .from(events)
    .where(and(...conds))
    .orderBy(desc(events.liveCheckinAt))
    .limit(limit);
}

/**
 * 県ごとの「これから/ライブ中」公開イベント件数。在席マップのグリッド（「千葉 5件」）用。
 */
export async function countByPrefecture(
  db: DB,
  now: Date
): Promise<{ prefecture: string; count: number }[]> {
  const rows = await db
    .select({
      prefecture: events.prefecture,
      count: sql<number>`count(*)`,
    })
    .from(events)
    .where(
      and(
        eq(events.visibility, "public"),
        eq(events.locationType, "offline"),
        sql`${events.prefecture} IS NOT NULL`,
        inArray(events.status, ["upcoming", "live"]),
        or(isNull(events.endAt), gt(events.endAt, now))
      )
    )
    .groupBy(events.prefecture);

  return rows
    .filter((r): r is { prefecture: string; count: number } => r.prefecture != null)
    .map((r) => ({ prefecture: r.prefecture, count: Number(r.count) }));
}

/** 自分が主催するイベント一覧。 */
export async function listMyEvents(db: DB, creatorId: number): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.creatorId, creatorId))
    .orderBy(desc(events.startAt));
}

/** status / liveCheckinAt を更新（ライブ表明・終了・キャンセル）。オーナーのみ。 */
export async function updateEventStatus(
  db: DB,
  params: {
    id: number;
    creatorId: number;
    status: "upcoming" | "live" | "ended" | "canceled";
    liveCheckinAt?: Date | null;
  }
): Promise<boolean> {
  const set: Partial<InsertEvent> = {
    status: params.status,
    updatedAt: new Date(),
  };
  if (params.liveCheckinAt !== undefined) set.liveCheckinAt = params.liveCheckinAt;

  const rows = await db
    .update(events)
    .set(set)
    .where(and(eq(events.id, params.id), eq(events.creatorId, params.creatorId)))
    .returning({ id: events.id });
  return rows.length > 0;
}
