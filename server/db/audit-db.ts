/**
 * server/db/audit-db.ts
 * 
 * 監査ログ関連のデータベース操作
 * 
 * v6.41: 監査ログ機能追加
 */

import { getDb, eq, desc, and, gte, lte } from "./connection";
import { auditLogs, InsertAuditLog, AuditAction, EntityType } from "../../drizzle/schema";

// =============================================================================
// 監査ログ記録
// =============================================================================

/**
 * 監査ログを記録
 */
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Database not available, skipping audit log");
    return null;
  }

  try {
    const [result] = await db.insert(auditLogs).values(data);
    return result.insertId ?? null;
  } catch (error) {
    // 監査ログの記録失敗は本体の処理を止めない
    console.error("[AuditLog] Failed to create audit log:", error);
    return null;
  }
}

/**
 * 操作の監査ログを記録するヘルパー関数
 */
export async function logAction(params: {
  requestId: string;
  action: AuditAction;
  entityType: EntityType;
  targetId?: number;
  actorId?: number;
  actorName?: string;
  actorRole?: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return createAuditLog({
    requestId: params.requestId,
    action: params.action,
    entityType: params.entityType,
    targetId: params.targetId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    beforeData: params.beforeData,
    afterData: params.afterData,
    reason: params.reason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

// =============================================================================
// 監査ログ取得
// =============================================================================

/**
 * 監査ログ一覧を取得（管理者用）
 */
export async function getAuditLogs(options?: {
  entityType?: string;
  targetId?: number;
  actorId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  // 基本クエリ
  let query = db.select().from(auditLogs);

  // フィルタ条件を構築
  const conditions = [];

  if (options?.entityType) {
    conditions.push(eq(auditLogs.entityType, options.entityType));
  }
  if (options?.targetId) {
    conditions.push(eq(auditLogs.targetId, options.targetId));
  }
  if (options?.actorId) {
    conditions.push(eq(auditLogs.actorId, options.actorId));
  }
  if (options?.startDate) {
    conditions.push(gte(auditLogs.createdAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(auditLogs.createdAt, options.endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const result = await query
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * 特定のrequestIdに関連する監査ログを取得
 */
export async function getAuditLogsByRequestId(requestId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(auditLogs)
    .where(eq(auditLogs.requestId, requestId))
    .orderBy(desc(auditLogs.createdAt));
}

/**
 * 特定のエンティティの操作履歴を取得
 */
export async function getEntityAuditHistory(entityType: string, targetId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(auditLogs)
    .where(and(
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.targetId, targetId)
    ))
    .orderBy(desc(auditLogs.createdAt));
}

/**
 * 特定のユーザーの操作履歴を取得
 */
export async function getUserAuditHistory(actorId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(auditLogs)
    .where(eq(auditLogs.actorId, actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
