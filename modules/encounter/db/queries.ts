/**
 * modules/encounter/db/queries.ts
 *
 * encounter 系テーブルへの Drizzle クエリ層。
 * tRPC ルーターから呼び出される。DBクライアントを引数で受け取り、
 * 純粋関数 (modules/encounter/core/*) とアプリコードとの橋渡しをする。
 */

import { and, desc, eq, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
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
import { H3_RES_5, H3_RES_7, kRing, toGrid, toH3Cell, toH3ParentCell } from "../core/geo.js";
import type { NearbyCandidate, TimeshiftCandidate } from "../core/matching.js";
import type { PrefectureCreatorListRow } from "../core/prefecture-creator-types.js";
import { LIVE_WINDOW_MS } from "../core/prefecture-creator-types.js";
import {
  classifyLocationToPrefectureName,
  isValidPrefectureName,
} from "../core/prefecture-classify.js";
import {
  canViewTrail,
  isListedInPrefectureDirectory,
  parseTrailVisibility,
} from "../core/trail-visibility.js";
import { isLivePresenceFresh, shortPlaceLabel } from "../core/live-presence.js";
import { isHomeMasked } from "../core/privacy.js";
import { isLocationVisibleToOthers, shouldMaskHomeCellFromShare } from "../core/location-visibility.js";
import { HOME_MASK_MIN_NIGHT_VISITS } from "../core/home-mask.js";
import {
  resolvePrefectureCreatorProfiles,
  toPrefectureCreatorListProfile,
} from "./prefecture-creator-profiles.js";
import { isValidShareSlug, normalizeTwitterUsername } from "../../../lib/twitter-username.js";
// すれ違い相手のハンドル解決は zukan と同じ実装に寄せる（自前実装を持たない＝再発防止）。
// modules/** は Vercel Functions 向けに .js 付き相対パス必須（@/ は使えない）。
import {
  extractTwitterIdFromOpenId,
  resolveTwitterCacheForUser,
} from "../core/prefecture-creator-row.js";
import type { TwitterFollowInfo } from "../core/prefecture-creator-types.js";
import { resolveListProfileImage } from "../../../lib/profile-image.js";

/** encounter 経路では follow 情報を使わない（X API を増やさないため）。毎回生成しないよう固定。 */
const EMPTY_FOLLOW_MAP: Map<number, TwitterFollowInfo> = new Map();
import { hasAmbiguousShareSlugChars, randomShareSlug } from "../../../lib/share-slug.js";

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
): Promise<number> {
  const [row] = await db
    .insert(locations)
    .values({
      userId: params.userId,
      h3R8: params.h3R8,
      h3R7: toH3ParentCell(params.h3R8, H3_RES_7),
      h3R5: toH3ParentCell(params.h3R8, H3_RES_5),
      latGrid: params.latGrid,
      lngGrid: params.lngGrid,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
      accuracyM: params.accuracyM ?? null,
      municipality: params.municipality ?? null,
      prefecture: params.prefecture ?? null,
      address: params.address ?? null,
      recordedAt: new Date(),
    })
    .returning({ id: locations.id });
  return row.id;
}

/**
 * 写真から取り込んだ足あとを1件保存する（2026-08-14）。
 *
 * insertLocation との違いは3点だけ。混ぜずに別関数にしてあるのは、
 * この3点が「取り違えると事故る」性質のものだから:
 *   1. recordedAt を呼び出し側が決める（撮影時刻。now ではない）
 *   2. visibility を明示的に "private" にする（勝手に公開しない）
 *   3. source に由来を残す（photo / manual）
 *
 * 設計: docs/photo-import-and-viral-DESIGN.md C-3。
 */
export async function insertImportedLocation(
  db: DB,
  params: {
    userId: number;
    h3R8: string;
    latGrid: number;
    lngGrid: number;
    lat: number;
    lng: number;
    municipality: string | null;
    prefecture: string | null;
    address?: string | null;
    /** 撮影時刻。Date は呼び出し側で epoch ms から作る（生SQLに埋めない） */
    recordedAt: Date;
    source: "photo" | "manual";
  }
): Promise<number> {
  const [row] = await db
    .insert(locations)
    .values({
      userId: params.userId,
      h3R8: params.h3R8,
      h3R7: toH3ParentCell(params.h3R8, H3_RES_7),
      h3R5: toH3ParentCell(params.h3R8, H3_RES_5),
      latGrid: params.latGrid,
      lngGrid: params.lngGrid,
      lat: params.lat,
      lng: params.lng,
      // 写真の EXIF は水平精度を持たないので不明として残す（0 と書くと「超高精度」に見える）
      accuracyM: null,
      municipality: params.municipality ?? null,
      prefecture: params.prefecture ?? null,
      address: params.address ?? null,
      recordedAt: params.recordedAt,
      // ★勝手に公開しない。公開は本人が足あとシートで1件ずつ行う
      visibility: "private",
      source: params.source,
    })
    .returning({ id: locations.id });
  return row.id;
}

/**
 * 同じ足あとが既にあるか（写真の二度取り込み・連写対策）。
 * 判定: 同じユーザー・同じ H3 res8 セル・撮影時刻が ±60 分以内・削除されていない。
 *
 * ★Date は Drizzle のビルダー経由で渡す。生 sql テンプレートに Date を埋めない
 *   （encounter.list が常時 500 になった実績がある）。
 */
export async function hasNearbyLocationAt(
  db: DB,
  params: { userId: number; h3R8: string; recordedAt: Date; windowMinutes?: number }
): Promise<boolean> {
  const windowMs = (params.windowMinutes ?? 60) * 60 * 1000;
  const from = new Date(params.recordedAt.getTime() - windowMs);
  const to = new Date(params.recordedAt.getTime() + windowMs);
  const rows = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.userId, params.userId),
        eq(locations.h3R8, params.h3R8),
        isNull(locations.deletedAt),
        gte(locations.recordedAt, from),
        lte(locations.recordedAt, to)
      )
    )
    .limit(1);
  return rows.length > 0;
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
  visibility: string;
  /** 本人が付けた店名など（主張）。address（事実）とは別物。 */
  placeName: string | null;
  note: string | null;
  noteUpdatedAt: Date | null;
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
      visibility: locations.visibility,
      placeName: locations.placeName,
      note: locations.note,
      noteUpdatedAt: locations.noteUpdatedAt,
    })
    .from(locations)
    .where(
      and(
        eq(locations.userId, selfUserId),
        isNull(locations.deletedAt),
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
 * 近距離ステージ（Tier1-2）候補取得。毎回のチェックインで同期実行。
 * 自分の locations.h3R7（候補絞り込み専用。cellToParent由来。visitedAreas.h3R7とは別物）の
 * kRing(2)（19セル・保証半径約4.5km）内にいる直近6時間の他ユーザー位置を取得。
 * 自分自身は除く。停止ユーザー除外。
 *
 * 移植元設計: docs/matching-tier-redesign-DESIGN.md §2.2
 */
export async function getNearCandidates(
  db: DB,
  selfUserId: number,
  selfH3R7: string
): Promise<NearbyCandidate[]> {
  const ringCells = kRing(selfH3R7, 2);
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
        inArray(locations.h3R7, ringCells),
        gte(locations.recordedAt, since),
        isNull(locations.deletedAt),
        sql`${locations.userId} != ${selfUserId}`,
        eq(users.isSuspended, false)
      )
    )
    .orderBy(desc(locations.recordedAt))
    .limit(500);

  return rows.map((r) => ({
    userId: r.userId,
    latGrid: r.latGrid,
    lngGrid: r.lngGrid,
    h3R8: r.h3R8,
    recordedAt: r.recordedAt,
  }));
}

/**
 * 広域ステージ（Tier3-4）候補取得。近距離ステージがマッチ0件かつ当日未マッチのときのみ実行。
 * 自分の locations.h3R5 の kRing(4)（61セル・50km地点まで全方位カバー確認済み）内にいる
 * 直近24時間の他ユーザー位置を、ユーザーごとに最新1件（DISTINCT ON）に絞って取得。
 *
 * 移植元設計: docs/matching-tier-redesign-DESIGN.md §2.3
 * （k値はFableの初期案k=3から、司令塔の全方位実測でk=4に修正済み。50km地点でk=3は42%取りこぼす）
 */
export async function getWideCandidates(
  db: DB,
  selfUserId: number,
  selfH3R5: string
): Promise<NearbyCandidate[]> {
  const ringCells = kRing(selfH3R5, 4);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const rows = await db
    .selectDistinctOn([locations.userId], {
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
        inArray(locations.h3R5, ringCells),
        gte(locations.recordedAt, since),
        isNull(locations.deletedAt),
        sql`${locations.userId} != ${selfUserId}`,
        eq(users.isSuspended, false)
      )
    )
    .orderBy(locations.userId, desc(locations.recordedAt))
    .limit(500);

  return rows.map((r) => ({
    userId: r.userId,
    latGrid: r.latGrid,
    lngGrid: r.lngGrid,
    h3R8: r.h3R8,
    recordedAt: r.recordedAt,
  }));
}

/** タイムシフト候補に含める「最近アクティブ」の定義（休眠テストアカウント除外） */
export const TIMESHIFT_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * 自分の h3R7 セル内で過去30日に訪問したユーザー（タイムシフト候補）。
 * 自分自身・停止ユーザー除外。直近7日以内に位置記録があるユーザーのみ。
 */
export async function getTimeshiftCandidates(
  db: DB,
  selfUserId: number,
  selfH3R7: string
): Promise<TimeshiftCandidate[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeSince = new Date(Date.now() - TIMESHIFT_ACTIVE_WINDOW_MS);

  // 直近アクティブなユーザー ID を先に取得（EXISTS サブクエリより Drizzle 互換性が高い）
  const activeUserRows = await db
    .selectDistinct({ userId: locations.userId })
    .from(locations)
    .innerJoin(users, eq(users.id, locations.userId))
    .where(
      and(
        gte(locations.recordedAt, activeSince),
        isNull(locations.deletedAt),
        ne(locations.userId, selfUserId),
        eq(users.isSuspended, false),
      ),
    );

  const activeUserIds = activeUserRows.map((r) => r.userId);
  if (activeUserIds.length === 0) return [];

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
        ne(visitedAreas.userId, selfUserId),
        eq(users.isSuspended, false),
        inArray(visitedAreas.userId, activeUserIds),
      ),
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

/**
 * 複数の encounter を1回のクエリでバルク挿入する（UNIQUE(userAId,userBId,dayKey)衝突は無視）。
 * チェックイン1回あたりのマッチ件数分だけ逐次 INSERT していたN+1ループ
 * （旧 insertEncounterIfNew を for-await で呼ぶ形。マッチ件数分だけ往復が線形増加していた）
 * をこちらに置き換える。戻り値は実際に新規挿入された件数（衝突でスキップされた分は含まない）。
 *
 * Vercel⇄Railwayレイテンシ調査（2026-07-23）で発見したN+1パターンの解消。
 */
export async function insertEncountersIfNew(
  db: DB,
  paramsList: InsertEncounterParams[]
): Promise<number> {
  if (paramsList.length === 0) return 0;

  const result = await db
    .insert(encounters)
    .values(
      paramsList.map((params) => ({
        userAId: params.userAId,
        userBId: params.userBId,
        tier: params.tier,
        h3R7: params.h3R7,
        areaName: params.areaName,
        prefecture: params.prefecture,
        occurredAt: params.occurredAt,
        dayKey: params.occurredAt.toISOString().slice(0, 10),
      }))
    )
    .onConflictDoNothing();

  // postgres.js(porsager)の insert 結果は `.rowCount` ではなく `.count` に実際の
  // 影響行数が入る（`.rowCount` は常に undefined。2026-07-23 実DB接続で実測確認済み）。
  // onConflictDoNothing で衝突スキップされた分はここで正しく除外される。
  const affected = (result as unknown as { count?: number })?.count ?? 0;
  return affected;
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
        /* 生sqlテンプレートにDateを直渡しするとdrizzleの型マッピングを迂回し、
           postgres.jsが ERR_INVALID_ARG_TYPE で落ちる(本番encounter.listが常時500だった真因)。
           必ず lt() 等の演算子で列の型マッピングを通すこと */
        lt(encounters.occurredAt, cursorDate)
      )
    )
    .orderBy(desc(encounters.occurredAt))
    .limit(20);

  // バッチ取得対象のパートナーID（ブロック相手は最初から除外）
  const partnerIds = [
    ...new Set(
      rows
        .map((row) => (row.userAId === selfUserId ? row.userBId : row.userAId))
        .filter((id) => !blockedIds.has(id))
    ),
  ];
  if (partnerIds.length === 0) return [];

  // パートナー情報を一括取得
  const partnerRows = await db
    .select({
      id: users.id,
      // openId は twitterUserCache.twitterId 経路の引き当てに使う（レガシーの twitter:<id> ユーザー）。
      // これが無いと表示名しか手がかりが無くなる（2026-08-07 の不具合の一因）。
      openId: users.openId,
      name: users.name,
      hitokoto: users.hitokoto,
      hitokotoUpdatedAt: users.hitokotoUpdatedAt,
      isSuspended: users.isSuspended,
    })
    .from(users)
    .where(inArray(users.id, partnerIds));
  const partnerById = new Map(partnerRows.map((p) => [p.id, p]));

  // 停止・行なしのパートナーは後続バッチの対象からも外す（従来のループ挙動と同じ）
  const visiblePartners = partnerRows.filter((p) => !p.isSuspended);
  if (visiblePartners.length === 0) return [];
  const visiblePartnerIds = visiblePartners.map((p) => p.id);

  // Twitterキャッシュを一括取得。
  //
  // ★ここで users.name（表示名）を twitterUsername と照合してはいけない（2026-08-07 修正）。
  // users.name に入るのは表示名（例「君斗りんく@動員ちゃれんじ」/ server/clerk-auth-sync.ts:59）で、
  // twitterUsername は X ハンドル（英数字と _ で1〜15文字）。日本語表示名では構造的に永久ヒットせず、
  //   - partnerProfileImage が null → アイコンが灰色プレースホルダー
  //   - partnerUsername に表示名が入り UI 側の検証で弾かれて「ID n」表示
  // になっていた。CLAUDE.md 設計原則4「交流はXに委譲」が成立しなくなる致命的な不具合。
  //
  // 引き当ては zukan で実運用中の resolveTwitterCacheForUser に委譲する（表示名は
  // isValidTwitterUsername を通らないと採用されない）。同じ問題が zukan 側で7回修正されているのに
  // encounter 側へ反映されなかったのは、解決ロジックが共通化されず各所に自前実装があったため。
  // 実装を1つに寄せることが再発防止そのもの。
  //
  // クエリは1本に保つこと。__tests__/get-my-encounters-contract.test.ts が
  // 「twitter_user_cache は1回だけ発行」という契約を固定している。
  const cacheDisplayNames = [
    ...new Set(visiblePartners.map((p) => p.name).filter((n): n is string => !!n)),
  ];
  const cacheHandleCandidates = [
    ...new Set(
      visiblePartners
        .map((p) => normalizeTwitterUsername(p.name))
        .filter((n): n is string => !!n),
    ),
  ];
  const cacheTwitterIds = [
    ...new Set(
      visiblePartners
        .map((p) => extractTwitterIdFromOpenId(p.openId))
        .filter((id): id is string => !!id),
    ),
  ];
  const cacheConditions = [
    cacheTwitterIds.length > 0 ? inArray(twitterUserCache.twitterId, cacheTwitterIds) : null,
    cacheDisplayNames.length > 0 ? inArray(twitterUserCache.displayName, cacheDisplayNames) : null,
    cacheHandleCandidates.length > 0
      ? inArray(twitterUserCache.twitterUsername, cacheHandleCandidates)
      : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);
  const cacheRows =
    cacheConditions.length > 0
      ? await db
          .select({
            twitterUsername: twitterUserCache.twitterUsername,
            twitterId: twitterUserCache.twitterId,
            displayName: twitterUserCache.displayName,
            profileImage: twitterUserCache.profileImage,
            followersCount: twitterUserCache.followersCount,
          })
          .from(twitterUserCache)
          .where(cacheConditions.length === 1 ? cacheConditions[0] : or(...cacheConditions))
      : [];
  // resolveTwitterCacheForUser は小文字キーで引くのでそれに合わせる。
  const cacheByUsername = new Map(
    cacheRows
      .filter((c) => !!c.twitterUsername)
      .map((c) => [c.twitterUsername.toLowerCase(), c] as const),
  );
  const cacheByTwitterId = new Map(
    cacheRows
      .filter((c): c is typeof c & { twitterId: string } => !!c.twitterId)
      .map((c) => [c.twitterId, c] as const),
  );
  const cacheByDisplayName = new Map(
    cacheRows
      .filter((c): c is typeof c & { displayName: string } => !!c.displayName)
      .map((c) => [c.displayName, c] as const),
  );

  // パートナーの累計すれ違い数を一括集計。
  // 従来の `userAId = p OR userBId = p` の count と等価になるよう、
  // userA側とuserB側を別々に GROUP BY して合算する（userB側は自己ペア行を除外して二重加算を防ぐ）。
  const [countARows, countBRows] = await Promise.all([
    db
      .select({
        partnerId: encounters.userAId,
        cnt: sql<number>`count(*)`,
      })
      .from(encounters)
      .where(inArray(encounters.userAId, visiblePartnerIds))
      .groupBy(encounters.userAId),
    db
      .select({
        partnerId: encounters.userBId,
        cnt: sql<number>`count(*)`,
      })
      .from(encounters)
      .where(
        and(
          inArray(encounters.userBId, visiblePartnerIds),
          ne(encounters.userAId, encounters.userBId)
        )
      )
      .groupBy(encounters.userBId),
  ]);
  const totalByPartnerId = new Map<number, number>();
  for (const row of [...countARows, ...countBRows]) {
    totalByPartnerId.set(
      row.partnerId,
      (totalByPartnerId.get(row.partnerId) ?? 0) + Number(row.cnt)
    );
  }

  // 組み立て（返却順は rows の順序を維持、除外条件は従来どおり）
  const items: EncounterListItem[] = [];

  for (const row of rows) {
    const partnerId = row.userAId === selfUserId ? row.userBId : row.userAId;
    if (blockedIds.has(partnerId)) continue;

    const partner = partnerById.get(partnerId);
    if (!partner) continue;
    if (partner.isSuspended) continue;

    // 多段解決（twitterUsername ヒント → openId の twitterId → 表示名がハンドル形式なら採用）に
    // 委譲する。followByUserId は encounter 経路では使わないので空 Map を渡す（X API を増やさない）。
    // 最後に displayName 一致のキャッシュで補う。
    const cachedTwitter =
      resolveTwitterCacheForUser(
        { id: partner.id, openId: partner.openId, name: partner.name },
        EMPTY_FOLLOW_MAP,
        cacheByTwitterId,
        cacheByUsername,
      ) ?? (partner.name ? cacheByDisplayName.get(partner.name) : undefined);

    // ハンドルはキャッシュ由来の検証済みの値だけを使う。
    // partner.name（表示名）へフォールバックしてはいけない ← それが今回の不具合の本体。
    const resolvedHandle = normalizeTwitterUsername(cachedTwitter?.twitterUsername);

    const partnerTotalEncounters = totalByPartnerId.get(partnerId) ?? 0;

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
      partnerUsername: resolvedHandle,
      partnerDisplayName: cachedTwitter?.displayName ?? partner.name,
      // ハンドルが取れれば X CDN 実画像 → unavatar の順で解決する（X API は呼ばない）。
      // kimito OGP / Clerk プロキシは resolveListProfileImage 側で弾かれる。
      // ハンドルが無いときは null（他人のハンドルを推測した unavatar URL を作らない）。
      partnerProfileImage: resolvedHandle
        ? resolveListProfileImage(resolvedHandle, cachedTwitter?.profileImage)
        : null,
      // followersCount は他人については表示しない方針だが、キャッシュにあれば返す。
      // 0 は「未取得」と区別できないので null にする（syncClerkTwitterProfileToDb は 0 で INSERT する）。
      partnerFollowersCount:
        typeof cachedTwitter?.followersCount === "number" && cachedTwitter.followersCount > 0
          ? cachedTwitter.followersCount
          : null,
    });
  }

  return items;
}

/**
 * 指定ユーザーが encounter の当事者（userAId/userBId のいずれか）かどうかを判定。
 * 存在しないencounterIdは false（react/open の存在確認に共用）。
 */
export async function isEncounterParty(
  db: DB,
  encounterId: number,
  userId: number
): Promise<boolean> {
  const rows = await db
    .select({ userAId: encounters.userAId, userBId: encounters.userBId })
    .from(encounters)
    .where(eq(encounters.id, encounterId))
    .limit(1);

  if (rows.length === 0) return false;
  const row = rows[0];
  return row.userAId === userId || row.userBId === userId;
}

// ---------------------------------------------------------------------------
// encounter.open — 開封
// ---------------------------------------------------------------------------

/** encounter の開封結果。呼び出し元(tRPC)がNOT_FOUND/FORBIDDENを判別するために使う。 */
export type OpenEncounterResult = "opened" | "not_found" | "forbidden";

export async function openEncounter(
  db: DB,
  selfUserId: number,
  encounterId: number
): Promise<OpenEncounterResult> {
  const rows = await db
    .select({ userAId: encounters.userAId, userBId: encounters.userBId })
    .from(encounters)
    .where(eq(encounters.id, encounterId))
    .limit(1);

  if (rows.length === 0) return "not_found";
  const row = rows[0];
  const now = new Date();

  if (row.userAId === selfUserId) {
    await db
      .update(encounters)
      .set({ openedByA: now })
      .where(
        and(eq(encounters.id, encounterId), sql`${encounters.openedByA} IS NULL`)
      );
    return "opened";
  }
  if (row.userBId === selfUserId) {
    await db
      .update(encounters)
      .set({ openedByB: now })
      .where(
        and(eq(encounters.id, encounterId), sql`${encounters.openedByB} IS NULL`)
      );
    return "opened";
  }
  return "forbidden";
}

// ---------------------------------------------------------------------------
// visitedAreas — 図鑑（自分の訪問 + すれ違い相手の prefecture 集計）
// ---------------------------------------------------------------------------

export type ZukanRow = {
  prefecture: string | null;
  municipality: string | null;
  visitCount: number;
  lastVisitedAt: Date;
  firstVisitedAt: Date;
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
      firstVisitedAt: visitedAreas.firstVisitedAt,
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
  const partnerId = sql<number>`CASE WHEN ${encounters.userAId} = ${selfUserId} THEN ${encounters.userBId} ELSE ${encounters.userAId} END`;

  const rows = await db
    .select({
      prefecture: encounters.prefecture,
      encounterCount: sql<number>`count(distinct ${partnerId})`,
    })
    .from(encounters)
    .where(
      or(eq(encounters.userAId, selfUserId), eq(encounters.userBId, selfUserId))
    )
    .groupBy(encounters.prefecture)
    .orderBy(sql`count(distinct ${partnerId}) DESC`);

  return rows.map((r) => ({
    prefecture: r.prefecture,
    encounterCount: Number(r.encounterCount),
  }));
}

/** すれ違った相手の人数（同日・同県の重複を数えない） */
export async function getDistinctEncounterPartnerCount(
  db: DB,
  selfUserId: number,
): Promise<number> {
  const partnerId = sql<number>`CASE WHEN ${encounters.userAId} = ${selfUserId} THEN ${encounters.userBId} ELSE ${encounters.userAId} END`;

  const rows = await db
    .select({
      count: sql<number>`count(distinct ${partnerId})`,
    })
    .from(encounters)
    .where(
      or(eq(encounters.userAId, selfUserId), eq(encounters.userBId, selfUserId)),
    );

  return Number(rows[0]?.count ?? 0);
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
      visibility: locations.visibility,
      placeName: locations.placeName,
      note: locations.note,
      noteUpdatedAt: locations.noteUpdatedAt,
    })
    .from(locations)
    .innerJoin(users, eq(locations.userId, users.id))
    .where(and(eq(users.isSuspended, false), isNull(locations.deletedAt)));

  const lastStayMap = new Map<number, Date>();
  for (const row of locationRows) {
    if (blockedIds.has(row.userId)) continue;
    if (!isLocationVisibleToOthers(row.visibility)) continue;

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

  const settingsRows = await db
    .select({
      userId: userSettings.userId,
      trailVisibility: userSettings.trailVisibility,
    })
    .from(userSettings)
    .where(inArray(userSettings.userId, activeUsers.map((u) => u.id)));

  const visibilityByUserId = new Map(
    settingsRows.map((row) => [row.userId, parseTrailVisibility(row.trailVisibility)]),
  );

  const publicUsers = activeUsers.filter((user) =>
    isListedInPrefectureDirectory(
      visibilityByUserId.get(user.id) ?? "public",
    ),
  );
  if (publicUsers.length === 0) return [];

  for (const user of publicUsers) {
    if (!isValidShareSlug(user.shareSlug)) {
      user.shareSlug = await getOrCreateUserShareSlug(db, user.id);
    }
  }

  const profileByUserId = await resolvePrefectureCreatorProfiles(db, publicUsers);

  const now = Date.now();
  const items: PrefectureCreatorListRow[] = [];

  for (const user of publicUsers) {
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
    locationId?: number | null;
    reason: string;
    detail: string | null;
  }
): Promise<void> {
  await db.insert(reports).values({
    reporterId: params.reporterId,
    targetUserId: params.targetUserId,
    locationId: params.locationId ?? null,
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
      | "locationPausedUntil"
      | "homeMaskCell"
      | "shareLocationPrecise"
      | "trailVisibility"
      | "livePresenceEnabled"
      | "livePresenceLat"
      | "livePresenceLng"
      | "livePresenceMunicipality"
      | "livePresenceUpdatedAt"
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

/** 2ユーザー間にすれ違い（encounters）が1件以上あるか。 */
export async function hasEncounterBetween(
  db: DB,
  userA: number,
  userB: number,
): Promise<boolean> {
  const [aId, bId] = userA < userB ? [userA, userB] : [userB, userA];
  const rows = await db
    .select({ id: encounters.id })
    .from(encounters)
    .where(and(eq(encounters.userAId, aId), eq(encounters.userBId, bId)))
    .limit(1);
  return rows.length > 0;
}

/** 本人の足あとをソフト削除（地図・公開・マッチングから除外）。 */
export async function softDeleteLocation(
  db: DB,
  userId: number,
  locationId: number,
): Promise<{ ok: boolean }> {
  const updated = await db
    .update(locations)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.userId, userId),
        isNull(locations.deletedAt),
      ),
    )
    .returning({ id: locations.id });
  return { ok: updated.length > 0 };
}

/**
 * 足あと1件に場所メモを保存（本人のみ）。
 *
 * placeName / note の両方が null なら3列とも null に戻す（＝メモ削除）。
 * 専用の delete は作らない（空にして保存＝削除、が利用者にとって自然なため）。
 */
export async function updateLocationNote(
  db: DB,
  userId: number,
  locationId: number,
  placeName: string | null,
  note: string | null,
): Promise<{ ok: boolean }> {
  const isEmpty = placeName === null && note === null;
  const updated = await db
    .update(locations)
    .set({
      placeName,
      note,
      noteUpdatedAt: isEmpty ? null : new Date(),
    })
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.userId, userId),
        isNull(locations.deletedAt),
      ),
    )
    .returning({ id: locations.id });
  return { ok: updated.length > 0 };
}

/** 足あと1件の公開/非公開を切り替え（本人のみ）。 */
export async function setLocationVisibility(
  db: DB,
  userId: number,
  locationId: number,
  visibility: "public" | "private",
): Promise<{ ok: boolean }> {
  const updated = await db
    .update(locations)
    .set({ visibility })
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.userId, userId),
        isNull(locations.deletedAt),
      ),
    )
    .returning({ id: locations.id });
  return { ok: updated.length > 0 };
}

async function canViewerAccessOwnerTrail(
  db: DB,
  ownerUserId: number,
  viewerUserId: number | null | undefined,
  visibilityRaw: string | null | undefined,
): Promise<boolean> {
  const visibility = parseTrailVisibility(visibilityRaw);
  const viewer = viewerUserId ?? null;
  if (viewer === ownerUserId) return true;

  const hasEncounter =
    visibility === "acquaintance" && viewer != null
      ? await hasEncounterBetween(db, ownerUserId, viewer)
      : false;

  return canViewTrail({
    visibility,
    ownerUserId,
    viewerUserId: viewer,
    hasEncounter,
  });
}

// ---------------------------------------------------------------------------
// 共有リンク（OGP）: shareSlug 生成 & slug→最新地点の解決
// ---------------------------------------------------------------------------

function usernameFromName(name: string | null): string | null {
  return normalizeTwitterUsername(name);
}

/**
 * ユーザーの公開共有スラッグを取得（無ければ生成して保存）。
 * 既に設定済みならそれを返す。生成は UNIQUE 衝突時に数回リトライ。
 * I/l 等の紛らわしい文字を含む旧スラッグは次回アクセス時に再生成する。
 */
/**
 * 発行済みの共有スラッグを読むだけ（無ければ null）。
 *
 * OGP画像の事前ウォーム（読み取り専用の query）から使う。ウォームは投機的処理なので、
 * 副作用として slug を発行してはいけない。発行が要る場面では
 * getOrCreateUserShareSlug を使うこと。
 */
export async function getUserShareSlug(db: DB, userId: number): Promise<string | null> {
  const rows = await db
    .select({ shareSlug: users.shareSlug })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const slug = rows[0]?.shareSlug;
  if (!slug || !isValidShareSlug(slug) || hasAmbiguousShareSlugChars(slug)) return null;
  return slug;
}

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
  if (
    rows[0].shareSlug &&
    isValidShareSlug(rows[0].shareSlug) &&
    !hasAmbiguousShareSlugChars(rows[0].shareSlug)
  ) {
    return rows[0].shareSlug;
  }

  // 未設定・無効・紛らわしい shareSlug は上書き生成
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

export type ShareInfo = {
  name: string | null;
  username: string | null;
  /** 市区町村（粗い粒度。公開サムネ用） */
  area: string | null;
  prefecture: string | null;
  /** 逆ジオコーディングの詳細住所。OGP文面で「正確な場所」を出すために使う（公開範囲設定に従う） */
  address: string | null;
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
  viewerUserId?: number | null,
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

  const allowed = await canViewerAccessOwnerTrail(
    db,
    u.id,
    viewerUserId,
    settings?.trailVisibility,
  );
  if (!allowed) return null;

  const visited = await db
    .select({
      prefecture: visitedAreas.prefecture,
      municipality: visitedAreas.municipality,
      visitCount: visitedAreas.visitCount,
      lastVisitedAt: visitedAreas.lastVisitedAt,
      firstVisitedAt: visitedAreas.firstVisitedAt,
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
  const maskHomeFromShare = shouldMaskHomeCellFromShare(homeMaskCell, viewerUserId, u.id);

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
      visibility: locations.visibility,
      placeName: locations.placeName,
      note: locations.note,
      noteUpdatedAt: locations.noteUpdatedAt,
    })
    .from(locations)
    .where(
      maskHomeFromShare
        ? and(
            eq(locations.userId, u.id),
            isNull(locations.deletedAt),
            ne(locations.h3R8, homeMaskCell!),
            sql`${locations.lat} IS NOT NULL`,
            sql`${locations.lng} IS NOT NULL`,
          )
        : and(
            eq(locations.userId, u.id),
            isNull(locations.deletedAt),
            sql`${locations.lat} IS NOT NULL`,
            sql`${locations.lng} IS NOT NULL`,
          ),
    )
    .orderBy(desc(locations.recordedAt))
    .limit(safeLimit);

  const isOwner = viewerUserId === u.id;
  const visibleRows = isOwner
    ? locRows
    : locRows.filter((row) => isLocationVisibleToOthers(row.visibility));

  const trailLocations: TrailLocation[] = visibleRows.flatMap((row) => {
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
export type GetShareInfoOptions = {
  /** OGP クローラー向け: 本人が発行した /u/<slug> なので自宅マスクを緩和 */
  ogpContext?: boolean;
  /**
   * X ユーザー名の解決（Clerk API への外部 HTTP）を省く。
   *
   * ユーザー操作を待たせる経路（ogp.getOrCreateShareSlug = Xでシェアのタップ直後）で使う。
   * この経路が欲しいのは地名と座標だけで username は使わないのに、Clerk が遅い・429 を返すと
   * シェア用の空タブが about:blank のまま固まっていた（2026-08-04 実機report）。
   * 表示名が要る OGP 生成側では従来どおり解決させる。
   */
  skipUsernameLookup?: boolean;
};

export async function getShareInfoBySlug(
  db: DB,
  slug: string,
  viewerUserId?: number | null,
  options?: GetShareInfoOptions,
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

  if (options?.skipUsernameLookup) {
    // 外部 API も追加クエリも踏まない（呼び出し側がユーザーを待たせている経路）
  } else if (!username && u.openId.startsWith("clerk:")) {
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
    address: null,
    lat: null,
    lng: null,
    hasLocation: false,
    zoom: 13,
    precise,
    recordedAt: null,
  };

  if (u.isSuspended) return noLocation;
  if (paused) return noLocation;

  if (options?.ogpContext !== true) {
    const allowed = await canViewerAccessOwnerTrail(
      db,
      u.id,
      viewerUserId,
      settings?.trailVisibility,
    );
    if (!allowed) return null;
  }

  const effectiveViewerId =
    options?.ogpContext === true ? u.id : viewerUserId;
  const maskHomeFromShare = shouldMaskHomeCellFromShare(
    homeMaskCell,
    effectiveViewerId,
    u.id,
  );

  const locRows = await db
    .select({
      lat: locations.lat,
      lng: locations.lng,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      municipality: locations.municipality,
      prefecture: locations.prefecture,
      address: locations.address,
      h3R8: locations.h3R8,
      recordedAt: locations.recordedAt,
      visibility: locations.visibility,
      placeName: locations.placeName,
      note: locations.note,
      noteUpdatedAt: locations.noteUpdatedAt,
    })
    .from(locations)
    .where(
      maskHomeFromShare
        ? and(
            eq(locations.userId, u.id),
            isNull(locations.deletedAt),
            ne(locations.h3R8, homeMaskCell!),
          )
        : and(eq(locations.userId, u.id), isNull(locations.deletedAt)),
    )
    .orderBy(desc(locations.recordedAt))
    .limit(20);

  const latestPublic = locRows.find((loc) => isLocationVisibleToOthers(loc.visibility));

  if (latestPublic) {
    const loc = latestPublic;
    const useExact =
      options?.ogpContext === true
        ? loc.lat !== null && loc.lng !== null
        : precise && loc.lat !== null && loc.lng !== null;
    return {
      name: u.name,
      username,
      area: loc.municipality,
      prefecture: loc.prefecture,
      // 詳細住所は正確な座標を出すときだけ添える（丸め座標のときに番地を出すと不整合になる）
      address: useExact ? loc.address : null,
      lat: useExact ? loc.lat : loc.latGrid,
      lng: useExact ? loc.lng : loc.lngGrid,
      hasLocation: true,
      zoom: useExact ? 14 : 13,
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
    address: null,
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
    .where(and(gte(locations.recordedAt, since), isNull(locations.deletedAt)));
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
      and(
        eq(locations.userId, userId),
        isNull(locations.deletedAt),
        gte(locations.recordedAt, since),
      ),
    )
    .groupBy(locations.h3R8)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  return rows.length > 0 ? rows[0].h3R8 : null;
}

/**
 * 夜間帯（JST 23:00〜05:59）のチェックインだけから自宅候補 h3R8 を推定。
 * 旅行先の昼チェックインを自宅と誤判定しないため checkIn の homeMaskCell 更新に使う。
 */
export async function getMostFrequentNightH3R8(
  db: DB,
  userId: number,
): Promise<string | null> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      h3R8: locations.h3R8,
      cnt: sql<number>`count(*)::int`,
    })
    .from(locations)
    .where(
      and(
        eq(locations.userId, userId),
        isNull(locations.deletedAt),
        gte(locations.recordedAt, since),
        sql`(extract(hour from ${locations.recordedAt} at time zone 'Asia/Tokyo') >= 23 OR extract(hour from ${locations.recordedAt} at time zone 'Asia/Tokyo') <= 5)`,
      ),
    )
    .groupBy(locations.h3R8)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  if (rows.length === 0 || Number(rows[0].cnt) < HOME_MASK_MIN_NIGHT_VISITS) {
    return null;
  }
  return rows[0].h3R8;
}

export type ActivePrefectureRow = {
  prefecture: string;
  peopleCount: number;
  liveCount: number;
};

export type ActivePrefecturesSummary = {
  prefectures: ActivePrefectureRow[];
  totalPeople: number;
};

/**
 * 公開中のユーザーが「いま／直近24h」にいる都道府県の集計（サイドナビ・図鑑マップ用）。
 */
export async function getActivePrefecturesSummary(db: DB): Promise<ActivePrefecturesSummary> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const liveStaleBefore = new Date(Date.now() - 5 * 60 * 1000);
  const liveWindowMs = 30 * 60 * 1000;
  const now = Date.now();

  type Acc = { userIds: Set<number>; liveCount: number };
  const byPref = new Map<string, Acc>();

  const bump = (prefecture: string, userId: number, isLive: boolean) => {
    if (!prefecture) return;
    let acc = byPref.get(prefecture);
    if (!acc) {
      acc = { userIds: new Set(), liveCount: 0 };
      byPref.set(prefecture, acc);
    }
    acc.userIds.add(userId);
    if (isLive) acc.liveCount += 1;
  };

  const liveRows = await db
    .select({
      userId: userSettings.userId,
      livePresenceMunicipality: userSettings.livePresenceMunicipality,
      livePresenceLat: userSettings.livePresenceLat,
      livePresenceLng: userSettings.livePresenceLng,
      livePresenceUpdatedAt: userSettings.livePresenceUpdatedAt,
      trailVisibility: userSettings.trailVisibility,
    })
    .from(userSettings)
    .innerJoin(users, eq(users.id, userSettings.userId))
    .where(
      and(
        eq(userSettings.livePresenceEnabled, true),
        eq(users.isSuspended, false),
        gte(userSettings.livePresenceUpdatedAt, liveStaleBefore),
      ),
    );

  for (const row of liveRows) {
    if (!isListedInPrefectureDirectory(parseTrailVisibility(row.trailVisibility))) continue;
    if (!row.livePresenceUpdatedAt) continue;
    const pref = classifyLocationToPrefectureName(
      null,
      row.livePresenceMunicipality,
      row.livePresenceLat,
      row.livePresenceLng,
    );
    if (!pref) continue;
    const isLive = now - row.livePresenceUpdatedAt.getTime() < liveWindowMs;
    bump(pref, row.userId, isLive);
  }

  const recentRows = await db
    .select({
      userId: locations.userId,
      prefecture: locations.prefecture,
      municipality: locations.municipality,
      lat: locations.lat,
      lng: locations.lng,
      latGrid: locations.latGrid,
      lngGrid: locations.lngGrid,
      recordedAt: locations.recordedAt,
      visibility: locations.visibility,
      placeName: locations.placeName,
      note: locations.note,
      noteUpdatedAt: locations.noteUpdatedAt,
      trailVisibility: userSettings.trailVisibility,
    })
    .from(locations)
    .innerJoin(users, eq(users.id, locations.userId))
    .leftJoin(userSettings, eq(userSettings.userId, locations.userId))
    .where(
      and(
        eq(users.isSuspended, false),
        isNull(locations.deletedAt),
        gte(locations.recordedAt, since24h),
      ),
    );

  for (const row of recentRows) {
    if (!isLocationVisibleToOthers(row.visibility)) continue;
    if (
      !isListedInPrefectureDirectory(
        parseTrailVisibility(row.trailVisibility ?? "public"),
      )
    ) {
      continue;
    }
    const pref = classifyLocationToPrefectureName(
      row.prefecture,
      row.municipality,
      row.lat ?? row.latGrid,
      row.lng ?? row.lngGrid,
    );
    if (!pref) continue;
    bump(pref, row.userId, false);
  }

  const prefectures: ActivePrefectureRow[] = [...byPref.entries()]
    .map(([prefecture, acc]) => ({
      prefecture,
      peopleCount: acc.userIds.size,
      liveCount: acc.liveCount,
    }))
    .sort((a, b) => b.peopleCount - a.peopleCount || b.liveCount - a.liveCount);

  const totalPeople = new Set(
    [...byPref.values()].flatMap((acc) => [...acc.userIds]),
  ).size;

  return { prefectures, totalPeople };
}

// ---------------------------------------------------------------------------
// リアルタイム居場所（レーダー）
// ---------------------------------------------------------------------------

export type LivePresenceMarker = {
  userId: number;
  name: string | null;
  profileImage: string | null;
  lat: number;
  lng: number;
  place: string | null;
  updatedAt: string;
  isSelf: boolean;
};

export async function updateLivePresencePosition(
  db: DB,
  userId: number,
  input: {
    lat: number;
    lng: number;
    municipality?: string | null;
    prefecture?: string | null;
  },
): Promise<{ ok: boolean; masked: boolean }> {
  const settings = await getUserSettings(db, userId);
  if (!settings?.livePresenceEnabled) return { ok: false, masked: false };
  if (
    settings.locationPausedUntil &&
    settings.locationPausedUntil.getTime() > Date.now()
  ) {
    return { ok: false, masked: false };
  }

  const { latGrid, lngGrid } = toGrid(input.lat, input.lng);
  const h3R8 = toH3Cell(latGrid, lngGrid, 8);
  const masked = isHomeMasked(h3R8, settings.homeMaskCell);

  const inferredPrefecture = classifyLocationToPrefectureName(
    input.prefecture,
    input.municipality,
    input.lat,
    input.lng,
  );

  const place = masked
    ? "ひみつの場所"
    : shortPlaceLabel(input.municipality ?? null, inferredPrefecture);

  await upsertUserSettings(db, userId, {
    livePresenceLat: input.lat,
    livePresenceLng: input.lng,
    livePresenceMunicipality: place,
    livePresenceUpdatedAt: new Date(),
  });

  return { ok: true, masked };
}

export async function listLivePresenceForViewer(
  db: DB,
  viewerUserId: number,
): Promise<LivePresenceMarker[]> {
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
  const blockSet = await getBlockSet(db, viewerUserId);

  const rows = await db
    .select({
      userId: userSettings.userId,
      livePresenceLat: userSettings.livePresenceLat,
      livePresenceLng: userSettings.livePresenceLng,
      livePresenceMunicipality: userSettings.livePresenceMunicipality,
      livePresenceUpdatedAt: userSettings.livePresenceUpdatedAt,
      locationPausedUntil: userSettings.locationPausedUntil,
      homeMaskCell: userSettings.homeMaskCell,
      name: users.name,
      isSuspended: users.isSuspended,
    })
    .from(userSettings)
    .innerJoin(users, eq(users.id, userSettings.userId))
    .where(
      and(
        eq(userSettings.livePresenceEnabled, true),
        gte(userSettings.livePresenceUpdatedAt, staleBefore),
      ),
    );

  const out: LivePresenceMarker[] = [];

  for (const row of rows) {
    if (row.isSuspended) continue;
    if (
      row.locationPausedUntil &&
      row.locationPausedUntil.getTime() > Date.now()
    ) {
      continue;
    }
    if (row.livePresenceLat == null || row.livePresenceLng == null) continue;
    if (!isLivePresenceFresh(row.livePresenceUpdatedAt)) continue;

    const isSelf = row.userId === viewerUserId;
    if (!isSelf) {
      const a = Math.min(viewerUserId, row.userId);
      const b = Math.max(viewerUserId, row.userId);
      if (blockSet.has(`${a}-${b}`)) continue;
    }

    let profileImage: string | null = null;
    if (row.name) {
      const { lookupCacheByDisplayNameFuzzy } = await import(
        "../../../server/creator-profile-enricher.js"
      );
      profileImage =
        (await lookupCacheByDisplayNameFuzzy(db, row.name))?.profileImage ?? null;
    }

    const { latGrid, lngGrid } = toGrid(row.livePresenceLat, row.livePresenceLng);
    const h3R8 = toH3Cell(latGrid, lngGrid, 8);
    const masked = isHomeMasked(h3R8, row.homeMaskCell);
    if (masked && !isSelf) continue;

    out.push({
      userId: row.userId,
      name: row.name,
      profileImage,
      lat: row.livePresenceLat,
      lng: row.livePresenceLng,
      place: row.livePresenceMunicipality ?? null,
      updatedAt: row.livePresenceUpdatedAt!.toISOString(),
      isSelf,
    });
  }

  return out;
}

/**
 * 未開封のすれ違い件数と、その中で最新の encounter id を1クエリで取る。
 *
 * アプリ内通知（lib/encounter-notice.ts）の種。presence.pulse に相乗りして
 * 呼ばれるため、**必ず1クエリ・インデックス済みカラムのみ**で完結させること
 * （pulse は60秒ごとに来る。重いクエリを置くと電池とDB負荷の両方に効く）。
 *
 * 未開封の定義は getMyEncounters と揃える:
 * 自分が userA 側なら openedByA、userB 側なら openedByB が NULL。
 * ブロック相手は除外する（getMyEncounters は取得後に JS 側で弾いているが、
 * ここは件数だけなので SQL 内で NOT EXISTS にして1クエリに収める）。
 */
export async function getUnopenedEncounterSummary(
  db: DB,
  selfUserId: number
): Promise<{ count: number; latestId: number | null }> {
  const rows = await db
    .select({
      cnt: sql<number>`count(*)`,
      latestId: sql<number | null>`max(${encounters.id})`,
    })
    .from(encounters)
    .where(
      and(
        or(
          and(
            eq(encounters.userAId, selfUserId),
            isNull(encounters.openedByA)
          ),
          and(
            eq(encounters.userBId, selfUserId),
            isNull(encounters.openedByB)
          )
        ),
        // ブロック関係にある相手のすれ違いは数えない
        sql`not exists (
          select 1 from ${blocks}
          where (${blocks.blockerId} = ${selfUserId} and ${blocks.blockedId} = case when ${encounters.userAId} = ${selfUserId} then ${encounters.userBId} else ${encounters.userAId} end)
             or (${blocks.blockedId} = ${selfUserId} and ${blocks.blockerId} = case when ${encounters.userAId} = ${selfUserId} then ${encounters.userBId} else ${encounters.userAId} end)
        )`
      )
    );

  const row = rows[0];
  return {
    count: Number(row?.cnt ?? 0),
    latestId: row?.latestId != null ? Number(row.latestId) : null,
  };
}

/**
 * 自分とブロック関係にある相手の userId 一覧。
 *
 * getBlockSet がペアのキー集合を返すのに対し、こちらは「相手のID」だけを返す。
 * イベント一覧のフィルタ（modules/event/core/block-filter.ts）のように、
 * 相手IDで弾きたい場面で使う。
 *
 * ブロックは相互に効く: 自分がブロックした相手も、自分をブロックした相手も含む。
 */
export async function getBlockedUserIds(
  db: DB,
  selfUserId: number
): Promise<Set<number>> {
  const rows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(
      or(eq(blocks.blockerId, selfUserId), eq(blocks.blockedId, selfUserId))
    );

  const out = new Set<number>();
  for (const r of rows) {
    out.add(r.blockerId === selfUserId ? r.blockedId : r.blockerId);
  }
  return out;
}
