/**
 * DB growth monitoring and alerting.
 *
 * This mirrors api-cost-alert.ts: monthly in-memory alert suppression,
 * notifyOwner first, optional COST_ALERT_WEBHOOK_URL second.
 */

import { desc, gte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { dbStatsSnapshots } from "../drizzle/schema/index.js";
import * as schema from "../drizzle/schema/index.js";
import { notifyOwner } from "./_core/notification.js";

type DB = PostgresJsDatabase<typeof schema>;

type DbSizeRow = {
  locationsBytes?: number | string | bigint;
  locationsRows?: number | string | bigint;
  totalDbBytes?: number | string | bigint;
};

export type DbGrowthSnapshot = {
  id: number | null;
  capturedAt: Date;
  locationsBytes: number;
  locationsRows: number;
  totalDbBytes: number;
};

const alertSentFlags = new Map<string, boolean>();
const COST_ALERT_WEBHOOK_URL = process.env.COST_ALERT_WEBHOOK_URL ?? "";
const STORAGE_LIMIT_ENV_VALUES = [
  process.env.DB_STORAGE_LIMIT_BYTES,
  process.env.DATABASE_STORAGE_LIMIT_BYTES,
  process.env.RAILWAY_POSTGRES_STORAGE_LIMIT_BYTES,
];

function rowsFromExecute<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) return result[0] as T[];
    return result as T[];
  }
  const rows = (result as { rows?: T[] } | null)?.rows;
  return Array.isArray(rows) ? rows : [];
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function resolveStorageLimitBytes(): number | null {
  for (const raw of STORAGE_LIMIT_ENV_VALUES) {
    if (!raw) continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function sendDbAlertWebhook(payload: {
  title: string;
  content: string;
  severity: "warning" | "danger";
  totalDbBytes: number;
  storageLimitBytes: number | null;
}): Promise<void> {
  if (!COST_ALERT_WEBHOOK_URL) return;
  try {
    const res = await fetch(COST_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[DB Growth Alert] Webhook failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (error) {
    console.warn("[DB Growth Alert] Webhook error:", error);
  }
}

async function notifyDbGrowth(payload: {
  title: string;
  content: string;
  severity: "warning" | "danger";
  totalDbBytes: number;
  storageLimitBytes: number | null;
}): Promise<void> {
  try {
    await notifyOwner({ title: payload.title, content: payload.content });
  } catch (error) {
    console.warn("[DB Growth Alert] notifyOwner failed:", error);
  }
  await sendDbAlertWebhook(payload);
}

async function maybeSendDbGrowthAlert(
  db: DB,
  snapshot: DbGrowthSnapshot,
): Promise<void> {
  const storageLimitBytes = resolveStorageLimitBytes();
  if (!storageLimitBytes) {
    return;
  }

  const ratio = snapshot.totalDbBytes / storageLimitBytes;
  const currentMonth = monthKey(snapshot.capturedAt);

  if (ratio >= 0.9) {
    const key = `db_growth_${currentMonth}_absolute_90`;
    if (!alertSentFlags.get(key)) {
      alertSentFlags.set(key, true);
      await notifyDbGrowth({
        title: "DB容量 危険アラート",
        severity: "danger",
        totalDbBytes: snapshot.totalDbBytes,
        storageLimitBytes,
        content: [
          "Railway PostgreSQL の使用量がプラン容量の90%を超えています。",
          `現在: ${formatBytes(snapshot.totalDbBytes)} / 上限: ${formatBytes(storageLimitBytes)}`,
          `locations: ${formatBytes(snapshot.locationsBytes)} / 推定 ${snapshot.locationsRows.toLocaleString("ja-JP")} 行`,
        ].join("\n"),
      });
    }
  } else if (ratio >= 0.7) {
    const key = `db_growth_${currentMonth}_absolute_70`;
    if (!alertSentFlags.get(key)) {
      alertSentFlags.set(key, true);
      await notifyDbGrowth({
        title: "DB容量 警告アラート",
        severity: "warning",
        totalDbBytes: snapshot.totalDbBytes,
        storageLimitBytes,
        content: [
          "Railway PostgreSQL の使用量がプラン容量の70%を超えています。",
          `現在: ${formatBytes(snapshot.totalDbBytes)} / 上限: ${formatBytes(storageLimitBytes)}`,
          `locations: ${formatBytes(snapshot.locationsBytes)} / 推定 ${snapshot.locationsRows.toLocaleString("ja-JP")} 行`,
        ].join("\n"),
      });
    }
  }

  const since = new Date(snapshot.capturedAt.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent = await db
    .select()
    .from(dbStatsSnapshots)
    .where(gte(dbStatsSnapshots.capturedAt, since))
    .orderBy(desc(dbStatsSnapshots.capturedAt));

  if (recent.length < 2) return;

  const newest = recent[0];
  const oldest = recent[recent.length - 1];
  const elapsedDays = Math.max(
    1,
    (newest.capturedAt.getTime() - oldest.capturedAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  const dailyDelta = Math.max(0, (newest.totalDbBytes - oldest.totalDbBytes) / elapsedDays);
  if (dailyDelta <= 0) return;

  const remainingBytes = Math.max(0, storageLimitBytes - newest.totalDbBytes);
  const daysRemaining = remainingBytes / dailyDelta;
  if (daysRemaining >= 90) return;

  const key = `db_growth_${currentMonth}_velocity_90d`;
  if (alertSentFlags.get(key)) return;
  alertSentFlags.set(key, true);

  await notifyDbGrowth({
    title: "DB成長速度 警告アラート",
    severity: "warning",
    totalDbBytes: newest.totalDbBytes,
    storageLimitBytes,
    content: [
      "直近のDB成長速度だと、90日以内にプラン容量へ到達する見込みです。",
      `推定残り日数: ${Math.ceil(daysRemaining)}日`,
      `日次増分: ${formatBytes(dailyDelta)} / 現在: ${formatBytes(newest.totalDbBytes)}`,
      `locations: ${formatBytes(newest.locationsBytes)} / 推定 ${newest.locationsRows.toLocaleString("ja-JP")} 行`,
    ].join("\n"),
  });
}

export async function recordDbGrowthSnapshot(db: DB): Promise<DbGrowthSnapshot> {
  const result = await db.execute(sql`
    SELECT
      pg_total_relation_size('locations') AS "locationsBytes",
      COALESCE((SELECT reltuples::bigint FROM pg_class WHERE relname = 'locations'), 0) AS "locationsRows",
      pg_database_size(current_database()) AS "totalDbBytes"
  `);

  const row = rowsFromExecute<DbSizeRow>(result)[0] ?? {};
  const capturedAt = new Date();
  const values = {
    capturedAt,
    locationsBytes: toSafeNumber(row.locationsBytes),
    locationsRows: toSafeNumber(row.locationsRows),
    totalDbBytes: toSafeNumber(row.totalDbBytes),
  };

  const inserted = await db
    .insert(dbStatsSnapshots)
    .values(values)
    .returning({ id: dbStatsSnapshots.id });

  const snapshot: DbGrowthSnapshot = {
    id: inserted[0]?.id ?? null,
    ...values,
  };

  await maybeSendDbGrowthAlert(db, snapshot);
  return snapshot;
}

export function resetDbGrowthAlertFlags(): void {
  alertSentFlags.clear();
}
