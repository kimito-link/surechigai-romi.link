/**
 * modules/encounter/db/queries.ts
 *
 * encounter 系テーブルへの Drizzle クエリ層。
 * tRPC ルーターから呼び出される。DBクライアントを引数で受け取り、
 * 純粋関数 (modules/encounter/core/*) とアプリコードとの橋渡しをする。
 */

import { and, eq, gte, inArray, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema";
import {
  locations,
  encounters,
  visitedAreas,
  blocks,
  reports,
  userSettings,
  users,
} from "../../../drizzle/schema";
import { kRing } from "../core/geo.js";
import type { NearbyCandidate, TimeshiftCandidate } from "../core/matching.js";

type DB = PostgresJsDatabase<typeof schema>;

// ---------------------------------------------------------------------------
// locations
// ---------------------------------------------------------------------------

/** チェックイン位置を locations テーブルに INSERT */
export async function insertLocation(
  db: DB,
  params: {
    userId: number;
    h3R8: string;
    latGrid: number;
    lngGrid: number;
    municipality: string | null;
    prefecture: string | null;
  }
): Promise<void> {
  await db.insert(locations).values({
    userId: params.userId,
    h3R8: params.h3R8,
    latGrid: params.latGrid,
    lngGrid: params.lngGrid,
    municipality: params.municipality ?? null,
    prefecture: params.prefecture ?? null,
    recordedAt: new Date(),
  });
}

/**
 * 自分の h3R8 の kRing(1) 内にいる直近6時間の他ユーザー位置を取得。
 * 自分自身は除く。停止ユーザー除外。
 */
export async function getNearbyCandidates(
  db: DB,
  selfUserId: number,
  selfH3R8: string
): Promise<NearbyCandidate[]> {
  const ringCells = kRing(selfH3R8, 1);
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: locations.userId,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      h3R8: locations.h3R8,
      recordedAt: locations.recordedAt,
    })
    .from(locations)
    .innerJoin(users, eq(users.id, locations.userId))
    .where(
      and(
        inArray(locations.h3R8, ringCells),
        gte(locations.recordedAt, since),
        sql`${locations.userId} != ${selfUserId}`,
        eq(users.isSuspended, false)
      )
    );

  return rows.map((r) => ({
    userId: r.userId,
    latGrid: r.latGrid,
    lngGrid: r.lngGrid,
    h3R8: r.h3R8,
    recordedAt: r.recordedAt,
  }));
}

/**
 * 自分の h3R7 セル内で過去30日に訪問したユーザー（タイムシフト候補）。
 * 自分自身・停止ユーザー除外。
 */
export async function getTimeshiftCandidates(
  db: DB,
  selfUserId: number,
  selfH3R7: string
): Promise<TimeshiftCandidate[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: visitedAreas.userId,
      h3R7: visitedAreas.h3R7,
      municipality: visitedAreas.municipality,
      prefecture: visitedAreas.prefecture,
    })
    .from(visitedAreas)
    .innerJoin(users, eq(users.id, visitedAreas.userId))
    .where(
      and(
        eq(visitedAreas.h3R7, selfH3R7),
        gte(visitedAreas.lastVisitedAt, since),
        sql`${visitedAreas.userId} != ${selfUserId}`,
        eq(users.isSuspended, false)
      )
    );

  return rows.map((r) => ({
    userId: r.userId,
    h3R7: r.h3R7,
    municipality: r.municipality,
    prefecture: r.prefecture,
  }));
}

/**
 * 自分が絡むブロックペアの Set を返す。
 * キー形式: "min(a,b)-max(a,b)"
 */
export async function getBlockSet(
  db: DB,
  selfUserId: number
): Promise<Set<string>> {
  const rows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(
      or(eq(blocks.blockerId, selfUserId), eq(blocks.blockedId, selfUserId))
    );

  const set = new Set<string>();
  for (const r of rows) {
    const a = Math.min(r.blockerId, r.blockedId);
    const b = Math.max(r.blockerId, r.blockedId);
    set.add(`${a}-${b}`);
  }
  return set;
}

/**
 * 今日（UTC日付）に既にマッチ済みのペアセットを返す。
 */
export async function getTodayPairSet(
  db: DB,
  selfUserId: number
): Promise<Set<string>> {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const rows = await db
    .select({ userAId: encounters.userAId, userBId: encounters.userBId })
    .from(encounters)
    .where(
      and(
        eq(encounters.dayKey, today),
        or(
          eq(encounters.userAId, selfUserId),
          eq(encounters.userBId, selfUserId)
        )
      )
    );

  const set = new Set<string>();
  for (const r of rows) {
    set.add(`${r.userAId}-${r.userBId}`);
  }
  return set;
}

// ---------------------------------------------------------------------------
// encounters — INSERT（UNIQUE衝突は無視）
// ---------------------------------------------------------------------------

export type InsertEncounterParams = {
  userAId: number;
  userBId: number;
  tier: number;
  h3R7: string;
  areaName: string | null;
  prefecture: string | null;
  occurredAt: Date;
};

export async function insertEncounterIfNew(
  db: DB,
  params: InsertEncounterParams
): Promise<boolean> {
  const dayKey = params.occurredAt.toISOString().slice(0, 10);

  const result = await db
    .insert(encounters)
    .values({
      userAId: params.userAId,
      userBId: params.userBId,
      tier: params.tier,
      h3R7: params.h3R7,
      areaName: params.areaName,
      prefecture: params.prefecture,
      occurredAt: params.occurredAt,
      dayKey,
    })
    .onConflictDoNothing();

  // Drizzle の onConflictDoNothing は rowCount が 0 でも例外を投げない
  const affected = (result as unknown as { rowCount?: number })?.rowCount ?? 1;
  return affected > 0;
}

// ---------------------------------------------------------------------------
// visitedAreas — UPSERT
// ---------------------------------------------------------------------------

export async function upsertVisitedArea(
  db: DB,
  params: {
    userId: number;
    h3R7: string;
    municipality: string | null;
    prefecture: string | null;
  }
): Promise<void> {
  const now = new Date();
  await db
    .insert(visitedAreas)
    .values({
      userId: params.userId,
      h3R7: params.h3R7,
      municipality: params.municipality,
      prefecture: params.prefecture,
      firstVisitedAt: now,
      lastVisitedAt: now,
      visitCount: 1,
    })
    .onConflictDoUpdate({
      target: [visitedAreas.userId, visitedAreas.h3R7],
      set: {
        lastVisitedAt: now,
        visitCount: sql`${visitedAreas.visitCount} + 1`,
        municipality: sql`COALESCE(${visitedAreas.municipality}, ${params.municipality ?? null})`,
        prefecture: sql`COALESCE(${visitedAreas.prefecture}, ${params.prefecture ?? null})`,
      },
    });
}

// ---------------------------------------------------------------------------
// encounters — 一覧取得（封筒UI用）
// ---------------------------------------------------------------------------

export type EncounterListItem = {
  id: number;
  partnerId: number;
  partnerName: string | null;
  partnerHitokoto: string | null;
  partnerHitokotoUpdatedAt: Date | null;
  tier: number;
  h3R7: string | null;
  areaName: string | null;
  prefecture: string | null;
  occurredAt: Date;
  openedByMe: Date | null;
  partnerTotalEncounters: number;
};

/**
 * 自分のすれ違い一覧（封筒UI）。ブロック相手・停止ユーザー除外。
 * cursor = occurredAt（ISO文字列）でページング。
 */
export async function getMyEncounters(
  db: DB,
  selfUserId: number,
  cursor?: string
): Promise<EncounterListItem[]> {
  // ブロックセット取得
  const blockRows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(
      or(eq(blocks.blockerId, selfUserId), eq(blocks.blockedId, selfUserId))
    );
  const blockedIds = new Set<number>();
  for (const r of blockRows) {
    blockedIds.add(r.blockerId === selfUserId ? r.blockedId : r.blockerId);
  }

  const cursorDate = cursor ? new Date(cursor) : new Date();

  // 自分が userA または userB のすれ違いを取得
  const rows = await db
    .select({
      id: encounters.id,
      userAId: encounters.userAId,
      userBId: encounters.userBId,
      tier: encounters.tier,
      h3R7: encounters.h3R7,
      areaName: encounters.areaName,
      prefecture: encounters.prefecture,
      occurredAt: encounters.occurredAt,
      openedByA: encounters.openedByA,
      openedByB: encounters.openedByB,
    })
    .from(encounters)
    .where(
      and(
        or(eq(encounters.userAId, selfUserId), eq(encounters.userBId, selfUserId)),
        sql`${encounters.occurredAt} < ${cursorDate}`
      )
    )
    .orderBy(sql`${encounters.occurredAt} DESC`)
    .limit(20);

  const items: EncounterListItem[] = [];

  for (const row of rows) {
    const partnerId = row.userAId === selfUserId ? row.userBId : row.userAId;
    if (blockedIds.has(partnerId)) continue;

    // パートナー情報を取得
    const partnerRows = await db
      .select({
        name: users.name,
        hitokoto: users.hitokoto,
        hitokotoUpdatedAt: users.hitokotoUpdatedAt,
        isSuspended: users.isSuspended,
      })
      .from(users)
      .where(eq(users.id, partnerId))
      .limit(1);

    if (partnerRows.length === 0) continue;
    const partner = partnerRows[0];
    if (partner.isSuspended) continue;

    // パートナーの累計すれ違い数
    const countRows = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(encounters)
      .where(
        or(eq(encounters.userAId, partnerId), eq(encounters.userBId, partnerId))
      );
    const partnerTotalEncounters = Number(countRows[0]?.cnt ?? 0);

    const openedByMe =
      row.userAId === selfUserId ? row.openedByA : row.openedByB;

    items.push({
      id: row.id,
      partnerId,
      partnerName: partner.name,
      partnerHitokoto: partner.hitokoto,
      partnerHitokotoUpdatedAt: partner.hitokotoUpdatedAt,
      tier: row.tier,
      h3R7: row.h3R7,
      areaName: row.areaName,
      prefecture: row.prefecture,
      occurredAt: row.occurredAt,
      openedByMe,
      partnerTotalEncounters,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// encounter.open — 開封
// ---------------------------------------------------------------------------

export async function openEncounter(
  db: DB,
  selfUserId: number,
  encounterId: number
): Promise<void> {
  const rows = await db
    .select({ userAId: encounters.userAId, userBId: encounters.userBId })
    .from(encounters)
    .where(eq(encounters.id, encounterId))
    .limit(1);

  if (rows.length === 0) return;
  const row = rows[0];
  const now = new Date();

  if (row.userAId === selfUserId) {
    await db
      .update(encounters)
      .set({ openedByA: now })
      .where(
        and(eq(encounters.id, encounterId), sql`${encounters.openedByA} IS NULL`)
      );
  } else if (row.userBId === selfUserId) {
    await db
      .update(encounters)
      .set({ openedByB: now })
      .where(
        and(eq(encounters.id, encounterId), sql`${encounters.openedByB} IS NULL`)
      );
  }
}

// ---------------------------------------------------------------------------
// visitedAreas — 図鑑（自分の訪問 + すれ違い相手の prefecture 集計）
// ---------------------------------------------------------------------------

export type ZukanRow = {
  prefecture: string | null;
  visitCount: number;
  lastVisitedAt: Date;
};

export async function getMyVisitedAreas(
  db: DB,
  selfUserId: number
): Promise<ZukanRow[]> {
  const rows = await db
    .select({
      prefecture: visitedAreas.prefecture,
      visitCount: visitedAreas.visitCount,
      lastVisitedAt: visitedAreas.lastVisitedAt,
    })
    .from(visitedAreas)
    .where(eq(visitedAreas.userId, selfUserId))
    .orderBy(sql`${visitedAreas.lastVisitedAt} DESC`);

  return rows;
}

/** すれ違い相手の都道府県集計 */
export type EncounterPrefectureRow = {
  prefecture: string | null;
  encounterCount: number;
};

export async function getEncounterPrefectures(
  db: DB,
  selfUserId: number
): Promise<EncounterPrefectureRow[]> {
  const rows = await db
    .select({
      prefecture: encounters.prefecture,
      encounterCount: sql<number>`count(*)`,
    })
    .from(encounters)
    .where(
      or(eq(encounters.userAId, selfUserId), eq(encounters.userBId, selfUserId))
    )
    .groupBy(encounters.prefecture)
    .orderBy(sql`count(*) DESC`);

  return rows.map((r) => ({
    prefecture: r.prefecture,
    encounterCount: Number(r.encounterCount),
  }));
}

// ---------------------------------------------------------------------------
// blocks
// ---------------------------------------------------------------------------

export async function blockUser(
  db: DB,
  blockerId: number,
  blockedId: number
): Promise<void> {
  await db
    .insert(blocks)
    .values({ blockerId, blockedId, createdAt: new Date() })
    .onConflictDoNothing();
}

export async function unblockUser(
  db: DB,
  blockerId: number,
  blockedId: number
): Promise<void> {
  await db
    .delete(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
}

// ---------------------------------------------------------------------------
// reports + 自動停止
// ---------------------------------------------------------------------------

export async function createReport(
  db: DB,
  params: {
    reporterId: number;
    targetUserId: number;
    encounterId: number | null;
    reason: string;
    detail: string | null;
  }
): Promise<void> {
  await db.insert(reports).values({
    reporterId: params.reporterId,
    targetUserId: params.targetUserId,
    encounterId: params.encounterId,
    reason: params.reason,
    detail: params.detail,
    createdAt: new Date(),
  });

  // 異なる reporter から3件以上の通報で自動停止
  const countRows = await db
    .select({ cnt: sql<number>`count(distinct ${reports.reporterId})` })
    .from(reports)
    .where(eq(reports.targetUserId, params.targetUserId));

  const reporterCount = Number(countRows[0]?.cnt ?? 0);
  if (reporterCount >= 3) {
    await db
      .update(users)
      .set({ isSuspended: true })
      .where(eq(users.id, params.targetUserId));
  }
}

// ---------------------------------------------------------------------------
// userSettings
// ---------------------------------------------------------------------------

export async function getUserSettings(
  db: DB,
  userId: number
): Promise<schema.UserSettings | null> {
  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return rows.length > 0 ? rows[0] : null;
}

export async function upsertUserSettings(
  db: DB,
  userId: number,
  patch: Partial<Pick<schema.UserSettings, "locationPausedUntil" | "homeMaskCell">>
): Promise<void> {
  await db
    .insert(userSettings)
    .values({ userId, ...patch })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: patch,
    });
}

// ---------------------------------------------------------------------------
// sweep: 48h超 locations 削除
// ---------------------------------------------------------------------------

export async function deleteExpiredLocations(db: DB): Promise<number> {
  const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const result = await db
    .delete(locations)
    .where(sql`${locations.recordedAt} < ${threshold}`);
  return (result as unknown as { rowCount?: number })?.rowCount ?? 0;
}

/**
 * 取りこぼしマッチング: 直近48h内の locations で未マッチのユーザーを再スキャン。
 * sweep から呼ぶ用（userId リストを返すのみ、実際のマッチングはルーター側で実行）。
 */
export async function getRecentLocationUserIds(db: DB): Promise<number[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const rows = await db
    .selectDistinct({ userId: locations.userId })
    .from(locations)
    .where(gte(locations.recordedAt, since));
  return rows.map((r) => r.userId);
}

// ---------------------------------------------------------------------------
// encounters の homeMaskCell 計算（30日の最頻 h3R8）
// ---------------------------------------------------------------------------

/** 自分の過去30日チェックインから最頻 h3R8 を返す。なければ null */
export async function getMostFrequentH3R8(
  db: DB,
  userId: number
): Promise<string | null> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      h3R8: locations.h3R8,
      cnt: sql<number>`count(*) as cnt`,
    })
    .from(locations)
    .where(
      and(eq(locations.userId, userId), gte(locations.recordedAt, since))
    )
    .groupBy(locations.h3R8)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  return rows.length > 0 ? rows[0].h3R8 : null;
}
