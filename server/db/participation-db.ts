/**
 * server/db/participation-db.ts
 * 
 * 参加登録関連のデータベース操作
 * 
 * v6.40: ソフトデリート対応
 * - 全てのSELECTクエリで deletedAt IS NULL 条件を追加
 * - softDeleteParticipation 関数を追加
 */

import { getDb, eq, desc, sql, isNull, and } from "./connection";
import { participations, challenges, InsertParticipation } from "../../drizzle/schema";
import { invalidateEventsCache } from "./challenge-db";

// =============================================================================
// 参加者取得（ソフトデリート対応）
// =============================================================================

/**
 * イベントの参加者一覧を取得（削除済みを除く）
 */
export async function getParticipationsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participations)
    .where(and(
      eq(participations.challengeId, eventId),
      isNull(participations.deletedAt)
    ))
    .orderBy(desc(participations.createdAt));
}

/**
 * ユーザーの参加一覧を取得（削除済みを除く）
 */
export async function getParticipationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participations)
    .where(and(
      eq(participations.userId, userId),
      isNull(participations.deletedAt)
    ))
    .orderBy(desc(participations.createdAt));
}

/**
 * 参加IDで取得（削除済みも含む - 管理者用）
 */
export async function getParticipationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(participations).where(eq(participations.id, id));
  return result[0] || null;
}

/**
 * 参加IDで取得（削除済みを除く）
 */
export async function getActiveParticipationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(participations)
    .where(and(
      eq(participations.id, id),
      isNull(participations.deletedAt)
    ));
  return result[0] || null;
}

// =============================================================================
// 参加登録・更新
// =============================================================================

export async function createParticipation(data: InsertParticipation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(participations).values(data);
  const participationId = result.insertId;

  // challengesのcurrentValueを更新（参加者数 + 同伴者数）
  if (data.challengeId) {
    const contribution = (data.contribution || 1) + (data.companionCount || 0);
    await db.update(challenges)
      .set({ currentValue: sql`${challenges.currentValue} + ${contribution}` })
      .where(eq(challenges.id, data.challengeId));
    invalidateEventsCache();
  }

  return participationId;
}

export async function updateParticipation(id: number, data: Partial<InsertParticipation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(participations).set(data).where(eq(participations.id, id));
}

// =============================================================================
// 削除（ソフトデリート / 物理削除）
// =============================================================================

/**
 * ソフトデリート（削除フラグを立てる）
 * @param id 参加ID
 * @param deletedByUserId 削除を実行したユーザーID
 */
export async function softDeleteParticipation(id: number, deletedByUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 削除前に参加情報を取得
  const participation = await db.select().from(participations).where(eq(participations.id, id));
  const p = participation[0];

  if (!p) {
    throw new Error("Participation not found");
  }

  // ソフトデリート実行
  await db.update(participations)
    .set({
      deletedAt: new Date(),
      deletedBy: deletedByUserId,
    })
    .where(eq(participations.id, id));

  // challengesのcurrentValueを減少
  if (p.challengeId) {
    const contribution = (p.contribution || 1) + (p.companionCount || 0);
    await db.update(challenges)
      .set({ currentValue: sql`GREATEST(${challenges.currentValue} - ${contribution}, 0)` })
      .where(eq(challenges.id, p.challengeId));
    invalidateEventsCache();
  }

  return { success: true, challengeId: p.challengeId };
}

/**
 * 物理削除（完全に削除）- 管理者用または古いデータのクリーンアップ用
 */
export async function deleteParticipation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 削除前に参加情報を取得
  const participation = await db.select().from(participations).where(eq(participations.id, id));
  const p = participation[0];

  await db.delete(participations).where(eq(participations.id, id));

  // challengesのcurrentValueを減少（まだ削除されていない場合のみ）
  if (p && p.challengeId && !p.deletedAt) {
    const contribution = (p.contribution || 1) + (p.companionCount || 0);
    await db.update(challenges)
      .set({ currentValue: sql`GREATEST(${challenges.currentValue} - ${contribution}, 0)` })
      .where(eq(challenges.id, p.challengeId));
    invalidateEventsCache();
  }
}

// =============================================================================
// 統計・集計（ソフトデリート対応）
// =============================================================================

export async function getParticipationCountByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(participations)
    .where(and(
      eq(participations.challengeId, eventId),
      isNull(participations.deletedAt)
    ));
  return result.length;
}

export async function getTotalCompanionCountByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(COALESCE(${participations.contribution}, 1)), 0)` })
    .from(participations)
    .where(and(
      eq(participations.challengeId, eventId),
      isNull(participations.deletedAt)
    ));
  return Number(result[0]?.total ?? 0);
}

// 地域別の参加者数を取得（SQL GROUP BY で集計）
export async function getParticipationsByPrefecture(challengeId: number) {
  const db = await getDb();
  if (!db) return {};

  const result = await db
    .select({
      prefecture: sql<string>`COALESCE(${participations.prefecture}, '未設定')`.as("prefecture"),
      total: sql<number>`COALESCE(SUM(COALESCE(${participations.contribution}, 1)), 0)`.as("total"),
    })
    .from(participations)
    .where(and(
      eq(participations.challengeId, challengeId),
      isNull(participations.deletedAt)
    ))
    .groupBy(sql`COALESCE(${participations.prefecture}, '未設定')`);

  const prefectureMap: Record<string, number> = {};
  result.forEach(r => {
    prefectureMap[r.prefecture] = Number(r.total);
  });

  return prefectureMap;
}

// 貢献度ランキングを取得
export async function getContributionRanking(challengeId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(participations)
    .where(and(
      eq(participations.challengeId, challengeId),
      isNull(participations.deletedAt)
    ))
    .orderBy(desc(participations.contribution));

  return result.slice(0, limit).map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    displayName: p.displayName,
    username: p.username,
    profileImage: p.profileImage,
    contribution: p.contribution || 1,
    followersCount: p.followersCount || 0,
    isAnonymous: p.isAnonymous,
  }));
}

// 都道府県フィルターで参加者を取得
export async function getParticipationsByPrefectureFilter(challengeId: number, prefecture: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(participations)
    .where(sql`${participations.challengeId} = ${challengeId} AND ${participations.prefecture} = ${prefecture} AND ${participations.deletedAt} IS NULL`)
    .orderBy(desc(participations.createdAt));
}

// 参加方法別集計を取得（SQL GROUP BY で集計）
export async function getAttendanceTypeCounts(challengeId: number) {
  const db = await getDb();
  if (!db) return { venue: 0, streaming: 0, both: 0, total: 0 };

  const result = await db
    .select({
      attendanceType: sql<string>`COALESCE(${participations.attendanceType}, 'venue')`.as("attendanceType"),
      cnt: sql<number>`COUNT(*)`.as("cnt"),
    })
    .from(participations)
    .where(and(
      eq(participations.challengeId, challengeId),
      isNull(participations.deletedAt)
    ))
    .groupBy(sql`COALESCE(${participations.attendanceType}, 'venue')`);

  const counts = { venue: 0, streaming: 0, both: 0, total: 0 };
  result.forEach(r => {
    const type = r.attendanceType as string;
    const c = Number(r.cnt);
    if (type === "venue") counts.venue = c;
    else if (type === "streaming") counts.streaming = c;
    else if (type === "both") counts.both = c;
    counts.total += c;
  });

  return counts;
}

// 都道府県ランキングを取得
export async function getPrefectureRanking(challengeId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(participations)
    .where(and(
      eq(participations.challengeId, challengeId),
      isNull(participations.deletedAt)
    ));

  const prefectureMap: Record<string, { count: number; contribution: number }> = {};
  result.forEach(p => {
    const pref = p.prefecture || "未設定";
    if (!prefectureMap[pref]) {
      prefectureMap[pref] = { count: 0, contribution: 0 };
    }
    prefectureMap[pref].count += 1;
    prefectureMap[pref].contribution += p.contribution || 1;
  });

  return Object.entries(prefectureMap)
    .map(([prefecture, data]) => ({
      prefecture,
      count: data.count,
      contribution: data.contribution,
    }))
    .sort((a, b) => b.contribution - a.contribution);
}


// =============================================================================
// 管理者用機能（v6.44）
// =============================================================================

/**
 * 削除済み参加一覧を取得（管理者用）
 */
export async function getDeletedParticipations(filters?: {
  challengeId?: number;
  userId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(participations)
    .where(sql`${participations.deletedAt} IS NOT NULL`);

  // フィルタ適用
  const conditions: string[] = [`${participations.deletedAt} IS NOT NULL`];
  if (filters?.challengeId) {
    conditions.push(`${participations.challengeId} = ${filters.challengeId}`);
  }
  if (filters?.userId) {
    conditions.push(`${participations.userId} = ${filters.userId}`);
  }

  const result = await db.select().from(participations)
    .where(sql.raw(conditions.join(' AND ')))
    .orderBy(desc(participations.deletedAt))
    .limit(filters?.limit || 100);

  return result;
}

/**
 * 参加を復元（ソフトデリートを取り消し）
 */
export async function restoreParticipation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 復元前に参加情報を取得
  const participation = await db.select().from(participations).where(eq(participations.id, id));
  const p = participation[0];

  if (!p) {
    throw new Error("Participation not found");
  }

  if (!p.deletedAt) {
    throw new Error("Participation is not deleted");
  }

  // 復元実行
  await db.update(participations)
    .set({
      deletedAt: null,
      deletedBy: null,
    })
    .where(eq(participations.id, id));

  // challengesのcurrentValueを増加
  if (p.challengeId) {
    const contribution = (p.contribution || 1) + (p.companionCount || 0);
    await db.update(challenges)
      .set({ currentValue: sql`${challenges.currentValue} + ${contribution}` })
      .where(eq(challenges.id, p.challengeId));
    invalidateEventsCache();
  }

  return { success: true, challengeId: p.challengeId };
}

/**
 * 一括ソフトデリート（challengeId または userId 単位）
 */
export async function bulkSoftDeleteParticipations(
  filter: { challengeId?: number; userId?: number },
  deletedByUserId: number
): Promise<{ deletedCount: number; affectedChallengeIds: number[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!filter.challengeId && !filter.userId) {
    throw new Error("Either challengeId or userId must be specified");
  }

  // 削除対象を取得
  const conditions: string[] = [`${participations.deletedAt} IS NULL`];
  if (filter.challengeId) {
    conditions.push(`${participations.challengeId} = ${filter.challengeId}`);
  }
  if (filter.userId) {
    conditions.push(`${participations.userId} = ${filter.userId}`);
  }

  const targets = await db.select().from(participations)
    .where(sql.raw(conditions.join(' AND ')));

  if (targets.length === 0) {
    return { deletedCount: 0, affectedChallengeIds: [] };
  }

  // 一括ソフトデリート
  const targetIds = targets.map(t => t.id);
  await db.update(participations)
    .set({
      deletedAt: new Date(),
      deletedBy: deletedByUserId,
    })
    .where(sql`${participations.id} IN (${sql.raw(targetIds.join(','))})`);

  // challengesのcurrentValueを更新
  const challengeContributions: Record<number, number> = {};
  targets.forEach(p => {
    if (p.challengeId) {
      const contribution = (p.contribution || 1) + (p.companionCount || 0);
      challengeContributions[p.challengeId] = (challengeContributions[p.challengeId] || 0) + contribution;
    }
  });

  for (const [challengeId, contribution] of Object.entries(challengeContributions)) {
    await db.update(challenges)
      .set({ currentValue: sql`GREATEST(${challenges.currentValue} - ${contribution}, 0)` })
      .where(eq(challenges.id, Number(challengeId)));
  }

  invalidateEventsCache();

  return {
    deletedCount: targets.length,
    affectedChallengeIds: Object.keys(challengeContributions).map(Number),
  };
}

/**
 * 一括復元（challengeId または userId 単位）
 */
export async function bulkRestoreParticipations(
  filter: { challengeId?: number; userId?: number }
): Promise<{ restoredCount: number; affectedChallengeIds: number[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!filter.challengeId && !filter.userId) {
    throw new Error("Either challengeId or userId must be specified");
  }

  // 復元対象を取得
  const conditions: string[] = [`${participations.deletedAt} IS NOT NULL`];
  if (filter.challengeId) {
    conditions.push(`${participations.challengeId} = ${filter.challengeId}`);
  }
  if (filter.userId) {
    conditions.push(`${participations.userId} = ${filter.userId}`);
  }

  const targets = await db.select().from(participations)
    .where(sql.raw(conditions.join(' AND ')));

  if (targets.length === 0) {
    return { restoredCount: 0, affectedChallengeIds: [] };
  }

  // 一括復元
  const targetIds = targets.map(t => t.id);
  await db.update(participations)
    .set({
      deletedAt: null,
      deletedBy: null,
    })
    .where(sql`${participations.id} IN (${sql.raw(targetIds.join(','))})`);

  // challengesのcurrentValueを更新
  const challengeContributions: Record<number, number> = {};
  targets.forEach(p => {
    if (p.challengeId) {
      const contribution = (p.contribution || 1) + (p.companionCount || 0);
      challengeContributions[p.challengeId] = (challengeContributions[p.challengeId] || 0) + contribution;
    }
  });

  for (const [challengeId, contribution] of Object.entries(challengeContributions)) {
    await db.update(challenges)
      .set({ currentValue: sql`${challenges.currentValue} + ${contribution}` })
      .where(eq(challenges.id, Number(challengeId)));
  }

  invalidateEventsCache();

  return {
    restoredCount: targets.length,
    affectedChallengeIds: Object.keys(challengeContributions).map(Number),
  };
}
