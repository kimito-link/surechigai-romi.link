/**
 * modules/encounter/db/queries.ts
 *
 * encounter 系テーブルへの Drizzle クエリ層。
 * tRPC ルーターから呼び出される。DBクライアントを引数で受け取り、
 * 純粋関数 (modules/encounter/core/*) とアプリコードとの橋渡しをする。
 */

import { and, desc, eq, gte, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import {
  locations,
  groupVisitReports,
  encounters,
  visitedAreas,
  blocks,
  reports,
  userSettings,
  users,
  twitterUserCache,
} from "../../../drizzle/schema/index.js";
import { kRing } from "../core/geo.js";
import type { NearbyCandidate, TimeshiftCandidate } from "../core/matching.js";
import type { PrefectureCreatorListRow } from "../core/prefecture-creator-types.js";
import { LIVE_WINDOW_MS } from "../core/prefecture-creator-types.js";
import {
  classifyLocationToPrefectureName,
  isValidPrefectureName,
} from "../core/prefecture-classify.js";
import {
  resolvePrefectureCreatorProfiles,
  toPrefectureCreatorListProfile,
} from "./prefecture-creator-profiles.js";
import { isValidShareSlug, normalizeTwitterUsername } from "../../../lib/twitter-username.js";

type DB = PostgresJsDatabase<typeof schema>;

/** Drizzle の sql\`max(...)\` 等が string で返る環境向け */
function coerceToDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// group_visit_reports
// ---------------------------------------------------------------------------

export type GroupVisitReportItem = {
  id: number;
  displayName: string;
  visitorToken: string | null;
  placeName: string | null;
  note: string | null;
  lat: number;
  lng: number;
  accuracyM: number | null;
  latGrid: number;
  lngGrid: number;
  h3R8: string;
  municipality: string | null;
  prefecture: string | null;
  address: string | null;
  reportedAt: Date;
};

export type GroupVisitStats = {
  totalReports: number;
  uniqueVisitors: number;
  areaCount: number;
  latestReportedAt: Date | null;
};

export async function insertGroupVisitReport(
  db: DB,
  params: {
    groupKey: string;
    visitorToken: string | null;
    displayName: string;
    placeName: string | null;
    note: string | null;
    lat: number;
    lng: number;
    accuracyM: number | null;
    latGrid: number;
    lngGrid: number;
    h3R8: string;
    municipality: string | null;
    prefecture: string | null;
    address: string | null;
  }
): Promise<GroupVisitReportItem> {
  const rows = await db
    .insert(groupVisitReports)
    .values({
      groupKey: params.groupKey,
      visitorToken: params.visitorToken,
      displayName: params.displayName,
      placeName: params.placeName,
      note: params.note,
      lat: params.lat,
      lng: params.lng,
      accuracyM: params.accuracyM,
      latGrid: params.latGrid,
      lngGrid: params.lngGrid,
      h3R8: params.h3R8,
      municipality: params.municipality,
      prefecture: params.prefecture,
      address: params.address,
      reportedAt: new Date(),
    })
    .returning({
      id: groupVisitReports.id,
      displayName: groupVisitReports.displayName,
      visitorToken: groupVisitReports.visitorToken,
      placeName: groupVisitReports.placeName,
      note: groupVisitReports.note,
      lat: groupVisitReports.lat,
      lng: groupVisitReports.lng,
      accuracyM: groupVisitReports.accuracyM,
      latGrid: groupVisitReports.latGrid,
      lngGrid: groupVisitReports.lngGrid,
      h3R8: groupVisitReports.h3R8,
      municipality: groupVisitReports.municipality,
      prefecture: groupVisitReports.prefecture,
      address: groupVisitReports.address,
      reportedAt: groupVisitReports.reportedAt,
    });

  return rows[0];
}

export async function listGroupVisitReports(
  db: DB,
  groupKey: string,
  limit = 120
): Promise<GroupVisitReportItem[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 300);

  return db
    .select({
      id: groupVisitReports.id,
      displayName: groupVisitReports.displayName,
      visitorToken: groupVisitReports.visitorToken,
      placeName: groupVisitReports.placeName,
      note: groupVisitReports.note,
      lat: groupVisitReports.lat,
      lng: groupVisitReports.lng,
      accuracyM: groupVisitReports.accuracyM,
      latGrid: groupVisitReports.latGrid,
      lngGrid: groupVisitReports.lngGrid,
      h3R8: groupVisitReports.h3R8,
      municipality: groupVisitReports.municipality,
      prefecture: groupVisitReports.prefecture,
      address: groupVisitReports.address,
      reportedAt: groupVisitReports.reportedAt,
    })
    .from(groupVisitReports)
    .where(eq(groupVisitReports.groupKey, groupKey))
    .orderBy(desc(groupVisitReports.reportedAt))
    .limit(safeLimit);
}

export async function getGroupVisitStats(
  db: DB,
  groupKey: string
): Promise<GroupVisitStats> {
  const rows = await db
    .select({
      totalReports: sql<number>`count(*)`,
      uniqueVisitors: sql<number>`count(distinct coalesce(${groupVisitReports.visitorToken}, ${groupVisitReports.displayName}))`,
      areaCount: sql<number>`count(distinct ${groupVisitReports.h3R8})`,
      latestReportedAt: sql<Date | null>`max(${groupVisitReports.reportedAt})`,
    })
    .from(groupVisitReports)
    .where(eq(groupVisitReports.groupKey, groupKey));

  const row = rows[0];
  return {
    totalReports: Number(row?.totalReports ?? 0),
    uniqueVisitors: Number(row?.uniqueVisitors ?? 0),
    areaCount: Number(row?.areaCount ?? 0),
    latestReportedAt: row?.latestReportedAt ?? null,
  };
}

// ---------------------------------------------------------------------------
// locations
// ---------------------------------------------------------------------------

/**
 * チェックイン位置を locations テーブルに INSERT。
 * 方針転換: 正確な lat/lng/accuracy も保存する（思い出の軌跡・聖地巡礼のため）。
 * 丸め済み latGrid/lngGrid はすれ違いマッチング用に引き続き保持。
 */
export async function insertLocation(
  db: DB,
  params: {
    userId: number;
    h3R8: string;
    latGrid: number;
    lngGrid: number;
    lat?: number | null;
    lng?: number | null;
    accuracyM?: number | null;
    municipality: string | null;
    prefecture: string | null;
    address?: string | null;
  }
): Promise<void> {
  await db.insert(locations).values({
    userId: params.userId,
    h3R8: params.h3R8,
    latGrid: params.latGrid,
    lngGrid: params.lngGrid,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    accuracyM: params.accuracyM ?? null,
    municipality: params.municipality ?? null,
    prefecture: params.prefecture ?? null,
    address: params.address ?? null,
    recordedAt: new Date(),
  });
}

export type TrailLocation = {
  id: number;
  h3R8: string;
  latGrid: number;
  lngGrid: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  municipality: string | null;
  prefecture: string | null;
  recordedAt: Date;
  address: string | null;
};

/**
 * 自分の正確な足あと。地図表示用なので lat/lng が保存済みの行だけ返す。
 * 他ユーザーの正確座標はこのクエリでは返さない。
 */
export async function getMyTrailLocations(
  db: DB,
  selfUserId: number,
  limit = 120
): Promise<TrailLocation[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 500);

  const rows = await db
    .select({
      id: locations.id,
      h3R8: locations.h3R8,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      lat: locations.lat,
      lng: locations.lng,
      accuracyM: locations.accuracyM,
      municipality: locations.municipality,
      prefecture: locations.prefecture,
      address: locations.address,
      recordedAt: locations.recordedAt,
    })
    .from(locations)
    .where(
      and(
        eq(locations.userId, selfUserId),
        sql`${locations.lat} IS NOT NULL`,
        sql`${locations.lng} IS NOT NULL`
      )
    )
    .orderBy(desc(locations.recordedAt))
    .limit(safeLimit);

  return rows.flatMap((row) => {
    if (row.lat === null || row.lng === null) return [];
    return [{
      ...row,
      lat: row.lat,
      lng: row.lng,
    }];
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
  partnerUsername: string | null;
  partnerDisplayName: string | null;
  partnerProfileImage: string | null;
  partnerFollowersCount: number | null;
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

    const usernameCandidate = (partner.name ?? "").replace(/^@/, "").trim();
    const cacheRows = usernameCandidate
      ? await db
          .select({
            twitterUsername: twitterUserCache.twitterUsername,
            displayName: twitterUserCache.displayName,
            profileImage: twitterUserCache.profileImage,
            followersCount: twitterUserCache.followersCount,
          })
          .from(twitterUserCache)
          .where(eq(twitterUserCache.twitterUsername, usernameCandidate))
          .limit(1)
      : [];
    const cachedTwitter = cacheRows[0];

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
      partnerUsername: (cachedTwitter?.twitterUsername ?? usernameCandidate) || null,
      partnerDisplayName: cachedTwitter?.displayName ?? partner.name,
      partnerProfileImage: cachedTwitter?.profileImage ?? null,
      partnerFollowersCount: cachedTwitter?.followersCount ?? null,
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
  municipality: string | null;
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
      municipality: visitedAreas.municipality,
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

export type EncounterUserRow = {
  partnerId: number;
  partnerName: string | null;
  partnerDisplayName: string | null;
  partnerUsername: string | null;
  partnerProfileImage: string | null;
  lastEncounteredAt: Date;
  encounterCount: number;
};

export async function getEncounterUsersByPrefecture(
  db: DB,
  selfUserId: number,
  prefecture: string
): Promise<EncounterUserRow[]> {
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

  // 指定県でのすれ違いを取得
  const rows = await db
    .select({
      userAId: encounters.userAId,
      userBId: encounters.userBId,
      occurredAt: encounters.occurredAt,
    })
    .from(encounters)
    .where(
      and(
        eq(encounters.prefecture, prefecture),
        or(eq(encounters.userAId, selfUserId), eq(encounters.userBId, selfUserId))
      )
    )
    .orderBy(desc(encounters.occurredAt));

  // パートナーIDごとに集計
  const partnerMap = new Map<number, { lastAt: Date; count: number }>();
  for (const row of rows) {
    const partnerId = row.userAId === selfUserId ? row.userBId : row.userAId;
    if (blockedIds.has(partnerId)) continue;
    
    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, { lastAt: row.occurredAt, count: 1 });
    } else {
      partnerMap.get(partnerId)!.count++;
    }
  }

  const items: EncounterUserRow[] = [];
  for (const [partnerId, stats] of partnerMap.entries()) {
    const partnerRows = await db
      .select({
        name: users.name,
        isSuspended: users.isSuspended,
      })
      .from(users)
      .where(eq(users.id, partnerId))
      .limit(1);

    if (partnerRows.length === 0) continue;
    const partner = partnerRows[0];
    if (partner.isSuspended) continue;

    const usernameCandidate = (partner.name ?? "").replace(/^@/, "").trim();
    const cacheRows = usernameCandidate
      ? await db
          .select({
            twitterUsername: twitterUserCache.twitterUsername,
            displayName: twitterUserCache.displayName,
            profileImage: twitterUserCache.profileImage,
          })
          .from(twitterUserCache)
          .where(eq(twitterUserCache.twitterUsername, usernameCandidate))
          .limit(1)
      : [];
    const cachedTwitter = cacheRows[0];

    items.push({
      partnerId,
      partnerName: partner.name,
      partnerDisplayName: cachedTwitter?.displayName ?? partner.name,
      partnerUsername: (cachedTwitter?.twitterUsername ?? usernameCandidate) || null,
      partnerProfileImage: cachedTwitter?.profileImage ?? null,
      lastEncounteredAt: stats.lastAt,
      encounterCount: stats.count,
    });
  }

  // 最後にすれ違った順にソート
  return items.sort((a, b) => b.lastEncounteredAt.getTime() - a.lastEncounteredAt.getTime());
}

export type { PrefectureCreatorListRow } from "../core/prefecture-creator-types.js";

/** 指定都道府県に足あと（locations）があるユーザーを、最終滞在日時順で返す。 */
export async function getCreatorsByPrefecture(
  db: DB,
  prefecture: string,
  viewerUserId?: number,
): Promise<PrefectureCreatorListRow[]> {
  if (!isValidPrefectureName(prefecture)) return [];

  const blockedIds = new Set<number>();
  if (viewerUserId != null) {
    const blockRows = await db
      .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
      .from(blocks)
      .where(or(eq(blocks.blockerId, viewerUserId), eq(blocks.blockedId, viewerUserId)));
    for (const r of blockRows) {
      blockedIds.add(r.blockerId === viewerUserId ? r.blockedId : r.blockerId);
    }
  }

  // surechigai-nico 同様: prefecture 列 NULL の行も municipality / 座標で県分類する
  const locationRows = await db
    .select({
      userId: locations.userId,
      prefecture: locations.prefecture,
      municipality: locations.municipality,
      lat: locations.lat,
      lng: locations.lng,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      recordedAt: locations.recordedAt,
    })
    .from(locations)
    .innerJoin(users, eq(locations.userId, users.id))
    .where(eq(users.isSuspended, false));

  const lastStayMap = new Map<number, Date>();
  for (const row of locationRows) {
    if (blockedIds.has(row.userId)) continue;

    const classified = classifyLocationToPrefectureName(
      row.prefecture,
      row.municipality,
      row.lat ?? row.latGrid,
      row.lng ?? row.lngGrid,
    );
    if (classified !== prefecture) continue;

    const recordedAt = coerceToDate(row.recordedAt);
    if (!recordedAt) continue;

    const prev = lastStayMap.get(row.userId);
    if (!prev || recordedAt.getTime() > prev.getTime()) {
      lastStayMap.set(row.userId, recordedAt);
    }
  }

  if (lastStayMap.size === 0) return [];

  const userIds = [...lastStayMap.keys()];
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      openId: users.openId,
      isSuspended: users.isSuspended,
      shareSlug: users.shareSlug,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const activeUsers = userRows.filter((u) => !u.isSuspended);
  if (activeUsers.length === 0) return [];

  for (const user of activeUsers) {
    if (!isValidShareSlug(user.shareSlug)) {
      user.shareSlug = await getOrCreateUserShareSlug(db, user.id);
    }
  }

  const profileByUserId = await resolvePrefectureCreatorProfiles(db, activeUsers);

  const now = Date.now();
  const items: PrefectureCreatorListRow[] = [];

  for (const user of activeUsers) {
    const lastStayedAt = lastStayMap.get(user.id);
    if (!lastStayedAt) continue;

    const cached = profileByUserId.get(user.id) ?? null;
    const profile = toPrefectureCreatorListProfile(user, cached);

    items.push({
      userId: user.id,
      displayName: profile.displayName,
      twitterHandle: profile.twitterHandle,
      profileImage: profile.profileImage,
      shareSlug: isValidShareSlug(user.shareSlug) ? user.shareSlug : null,
      lastStayedAt,
      isLive: now - lastStayedAt.getTime() < LIVE_WINDOW_MS,
    });
  }

  return items.sort((a, b) => b.lastStayedAt.getTime() - a.lastStayedAt.getTime());
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
  patch: Partial<
    Pick<
      schema.UserSettings,
      "locationPausedUntil" | "homeMaskCell" | "shareLocationPrecise"
    >
  >
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
// 共有リンク（OGP）: shareSlug 生成 & slug→最新地点の解決
// ---------------------------------------------------------------------------

function usernameFromName(name: string | null): string | null {
  return normalizeTwitterUsername(name);
}

/** 12文字の base62 風ランダムスラッグ（連番ID非公開のため）。 */
function randomShareSlug(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

/**
 * ユーザーの公開共有スラッグを取得（無ければ生成して保存）。
 * 既に設定済みならそれを返す。生成は UNIQUE 衝突時に数回リトライ。
 */
export async function getOrCreateUserShareSlug(
  db: DB,
  userId: number
): Promise<string | null> {
  const rows = await db
    .select({ shareSlug: users.shareSlug })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (rows.length === 0) return null;
  if (rows[0].shareSlug && isValidShareSlug(rows[0].shareSlug)) return rows[0].shareSlug;

  // 無効な shareSlug（表示名など）が入っている場合は上書き生成する
  if (rows[0].shareSlug && !isValidShareSlug(rows[0].shareSlug)) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = randomShareSlug();
      try {
        await db.update(users).set({ shareSlug: slug }).where(eq(users.id, userId));
        return slug;
      } catch {
        // UNIQUE 衝突 → 再試行
      }
    }
    return null;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomShareSlug();
    try {
      await db
        .update(users)
        .set({ shareSlug: slug })
        .where(and(eq(users.id, userId), isNull(users.shareSlug)));
      const check = await db
        .select({ shareSlug: users.shareSlug })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (check[0]?.shareSlug) return check[0].shareSlug;
    } catch {
      // UNIQUE 衝突 → 別スラッグで再試行
    }
  }
  return null;
}

export type ShareInfo = {
  name: string | null;
  username: string | null;
  /** 市区町村（粗い粒度。公開サムネ用） */
  area: string | null;
  prefecture: string | null;
  /** 地図ピン座標。precise=false は500m丸め、true は正確座標。地点非公開時は null。 */
  lat: number | null;
  lng: number | null;
  /** 地図ピンを出せるか（座標あり） */
  hasLocation: boolean;
  /** OGP地図のズーム。粒度設定に応じて町(13) or 詳細(16)。 */
  zoom: number;
  /** ユーザーが正確座標での公開を有効にしているか */
  precise: boolean;
  recordedAt: Date | null;
};

export type PublicTrailResult = {
  name: string | null;
  username: string | null;
  profileImage: string | null;
  shareSlug: string;
  paused: boolean;
  precise: boolean;
  locations: TrailLocation[];
  visited: ZukanRow[];
};

/**
 * 共有スラッグから公開軌跡を返す（/u/<slug> クリエイター詳細用）。
 * 停止・一時停止・homeMaskCell・precise 設定を尊重する。
 */
export async function getPublicTrailByShareSlug(
  db: DB,
  slug: string,
  limit = 120,
): Promise<PublicTrailResult | null> {
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      openId: users.openId,
      isSuspended: users.isSuspended,
      shareSlug: users.shareSlug,
    })
    .from(users)
    .where(eq(users.shareSlug, slug))
    .limit(1);
  if (userRows.length === 0) return null;

  const u = userRows[0];
  if (u.isSuspended) return null;

  let username = usernameFromName(u.name);
  if (!username && u.openId.startsWith("clerk:")) {
    const { fetchClerkTwitterProfiles } = await import(
      "../../../server/clerk-profile-sync.js"
    );
    const profiles = await fetchClerkTwitterProfiles([u.openId]);
    username = normalizeTwitterUsername(profiles.get(u.openId)?.twitterUsername);
  }
  if (!username && u.name) {
    const { lookupCacheByDisplayNameFuzzy } = await import(
      "../../../server/creator-profile-enricher.js"
    );
    const hit = await lookupCacheByDisplayNameFuzzy(db, u.name);
    username = normalizeTwitterUsername(hit?.twitterUsername);
  }

  let profileImage: string | null = null;
  if (u.name) {
    const { lookupCacheByDisplayNameFuzzy } = await import(
      "../../../server/creator-profile-enricher.js"
    );
    profileImage = (await lookupCacheByDisplayNameFuzzy(db, u.name))?.profileImage ?? null;
  }

  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, u.id))
    .limit(1);
  const settings = settingsRows[0];
  const precise = settings?.shareLocationPrecise ?? false;
  const paused = settings?.locationPausedUntil
    ? settings.locationPausedUntil.getTime() > Date.now()
    : false;
  const homeMaskCell = settings?.homeMaskCell ?? null;

  const visited = await db
    .select({
      prefecture: visitedAreas.prefecture,
      municipality: visitedAreas.municipality,
      visitCount: visitedAreas.visitCount,
      lastVisitedAt: visitedAreas.lastVisitedAt,
    })
    .from(visitedAreas)
    .where(eq(visitedAreas.userId, u.id))
    .orderBy(desc(visitedAreas.lastVisitedAt));

  if (paused) {
    return {
      name: u.name,
      username,
      profileImage,
      shareSlug: slug,
      paused: true,
      precise,
      locations: [],
      visited,
    };
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 500);
  const locRows = await db
    .select({
      id: locations.id,
      h3R8: locations.h3R8,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      lat: locations.lat,
      lng: locations.lng,
      accuracyM: locations.accuracyM,
      municipality: locations.municipality,
      prefecture: locations.prefecture,
      address: locations.address,
      recordedAt: locations.recordedAt,
    })
    .from(locations)
    .where(
      homeMaskCell
        ? and(
            eq(locations.userId, u.id),
            ne(locations.h3R8, homeMaskCell),
            sql`${locations.lat} IS NOT NULL`,
            sql`${locations.lng} IS NOT NULL`,
          )
        : and(
            eq(locations.userId, u.id),
            sql`${locations.lat} IS NOT NULL`,
            sql`${locations.lng} IS NOT NULL`,
          ),
    )
    .orderBy(desc(locations.recordedAt))
    .limit(safeLimit);

  const trailLocations: TrailLocation[] = locRows.flatMap((row) => {
    const useExact = precise && row.lat != null && row.lng != null;
    const lat = useExact ? row.lat : row.latGrid;
    const lng = useExact ? row.lng : row.lngGrid;
    if (lat == null || lng == null) return [];
    return [{ ...row, lat, lng }];
  });

  return {
    name: u.name,
    username,
    profileImage,
    shareSlug: slug,
    paused: false,
    precise,
    locations: trailLocations,
    visited,
  };
}

/**
 * 共有スラッグから、その人の「最後の記録地点」を市区町村粒度で解決する。
 * isSuspended / locationPausedUntil / homeMaskCell を尊重し、
 * 公開してよい場合のみ地点を返す。座標は500m丸め（latGrid/lngGrid）。
 */
export async function getShareInfoBySlug(
  db: DB,
  slug: string
): Promise<ShareInfo | null> {
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      openId: users.openId,
      isSuspended: users.isSuspended,
    })
    .from(users)
    .where(eq(users.shareSlug, slug))
    .limit(1);
  if (userRows.length === 0) return null;

  const u = userRows[0];
  let username = usernameFromName(u.name);

  if (!username && u.openId.startsWith("clerk:")) {
    const { fetchClerkTwitterProfiles, syncClerkTwitterProfileToDb } = await import(
      "../../../server/clerk-profile-sync.js"
    );
    const profiles = await fetchClerkTwitterProfiles([u.openId]);
    const profile = profiles.get(u.openId);
    if (profile) {
      await syncClerkTwitterProfileToDb(db, u.id, profile);
      username = profile.twitterUsername;
    }
  } else if (!username) {
    const cacheRows = await db
      .select({ twitterUsername: twitterUserCache.twitterUsername })
      .from(twitterUserCache)
      .where(eq(twitterUserCache.displayName, u.name ?? ""))
      .limit(1);
    username = normalizeTwitterUsername(cacheRows[0]?.twitterUsername);
  }

  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, u.id))
    .limit(1);
  const settings = settingsRows[0];
  const precise = settings?.shareLocationPrecise ?? false;
  const paused = settings?.locationPausedUntil
    ? settings.locationPausedUntil.getTime() > Date.now()
    : false;
  const homeMaskCell = settings?.homeMaskCell ?? null;

  const noLocation: ShareInfo = {
    name: u.name,
    username,
    area: null,
    prefecture: null,
    lat: null,
    lng: null,
    hasLocation: false,
    zoom: 13,
    precise,
    recordedAt: null,
  };

  if (u.isSuspended) return noLocation;
  if (paused) return noLocation;

  const locRows = await db
    .select({
      lat: locations.lat,
      lng: locations.lng,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      municipality: locations.municipality,
      prefecture: locations.prefecture,
      h3R8: locations.h3R8,
      recordedAt: locations.recordedAt,
    })
    .from(locations)
    .where(
      homeMaskCell
        ? and(eq(locations.userId, u.id), ne(locations.h3R8, homeMaskCell))
        : eq(locations.userId, u.id)
    )
    .orderBy(desc(locations.recordedAt))
    .limit(1);

  if (locRows.length > 0) {
    const loc = locRows[0];
    // precise かつ正確座標があれば詳細ズーム、なければ500m丸め＋町ズーム
    const useExact = precise && loc.lat !== null && loc.lng !== null;
    return {
      name: u.name,
      username,
      area: loc.municipality,
      prefecture: loc.prefecture,
      lat: useExact ? loc.lat : loc.latGrid,
      lng: useExact ? loc.lng : loc.lngGrid,
      hasLocation: true,
      zoom: useExact ? 16 : 13,
      precise,
      recordedAt: loc.recordedAt,
    };
  }

  // locations が無ければ visitedAreas（市区町村のみ・座標なし）にフォールバック
  const vaRows = await db
    .select({
      municipality: visitedAreas.municipality,
      prefecture: visitedAreas.prefecture,
      lastVisitedAt: visitedAreas.lastVisitedAt,
    })
    .from(visitedAreas)
    .where(eq(visitedAreas.userId, u.id))
    .orderBy(desc(visitedAreas.lastVisitedAt))
    .limit(1);
  if (vaRows.length === 0) return noLocation;
  const va = vaRows[0];
  return {
    name: u.name,
    username,
    area: va.municipality,
    prefecture: va.prefecture,
    lat: null,
    lng: null,
    hasLocation: false,
    zoom: 13,
    precise,
    recordedAt: va.lastVisitedAt,
  };
}

// ---------------------------------------------------------------------------
// sweep: 48h超 locations 削除
// ---------------------------------------------------------------------------

/**
 * 方針転換により無効化: locations は削除しない（思い出の軌跡として永続保存する）。
 * 以前は48h超を物理削除していたが、後で思い出の場所をたどれるよう残す方針へ。
 * sweep からの呼び出し互換のため関数は残し、常に 0 件削除を返す。
 * （DB側に TTL を持たせていないので、呼ばれても何もしないのが安全）
 */
export async function deleteExpiredLocations(_db: DB): Promise<number> {
  // 削除しない。永続化方針。
  return 0;
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
