/**
 * DB growth monitoring and alerting.
 *
 * This mirrors api-cost-alert.ts: monthly in-memory alert suppression,
 * notifyOwner first, optional COST_ALERT_WEBHOOK_URL second.
 */

import { desc, gte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { dbStatsSnapshots, usageSnapshots } from "../drizzle/schema/index.js";
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


/** usage_snapshots の1行。数値はすべて件数（バイトではない）。 */
export type UsageSnapshotResult = {
  id: number | null;
  capturedAt: Date;
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  usersWithLocations: number;
  activeLoggers7d: number;
  placeNotes: number;
  encounters: number;
  events: number;
  participations: number;
};

type UsageCountRow = Record<string, unknown>;

/** 利用状況スナップショットで数える列。★増やすときはここだけ触る。 */
export const USAGE_SNAPSHOT_COUNT_KEYS = [
  "totalUsers",
  "activeUsers7d",
  "activeUsers30d",
  "usersWithLocations",
  "activeLoggers7d",
  "placeNotes",
  "encounters",
  "events",
  "participations",
] as const;

/**
 * COUNT(*) の戻り値を数値にする。★測れなかったときは 0 にせず throw する。
 *
 * ★なぜ toSafeNumber を使わないか（このリポが繰り返し踏んだ型）
 *   toSafeNumber は undefined / null を **0 に丸める**。それだと
 *   「アクティブユーザーが0人」と「SQLが壊れて測れていない」が
 *   **同じ 0 として記録され、区別できなくなる**。
 *   計器の役目は「測れなかったことを測れなかったと言う」ことなので、
 *   ここでは黙って0を書かず、呼び出し側（api/sweep.ts）で
 *   usage: null / usageError として記録させる。
 */
export function parseUsageCount(key: string, value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(
    `[usage-snapshot] ${key} を数値にできませんでした（受け取った値: ${JSON.stringify(value)}）。` +
      "★0 として記録すると「0件」と「測れなかった」が区別できなくなるため中断します。",
  );
}

/**
 * 利用状況の日次スナップショットを1行記録する。
 *
 * ★recordDbGrowthSnapshot と同じ作法（SQL 1本 → insert → returning）で書いている。
 *   計器を増やすときに読み手が迷わないようにするため。
 *
 * ★COUNT(*) を使う理由: recordDbGrowthSnapshot は reltuples（推定値）を使っているが、
 *   あちらは「DBが何バイト太ったか」を見るので推定で足りる。
 *   こちらは「7日以内に戻ってきた人が0人か1人か」を見るので、
 *   **推定値では判断できない**。行数が小さいうちは COUNT(*) のコストも無視できる。
 *   ★行数が増えて重くなったら、そのとき推定へ切り替える（今その判断はしない）。
 *
 * ★この関数が測れないもの: 未登録の訪問者数。方式の限界（schema のコメント参照）。
 */
export async function recordUsageSnapshot(db: DB): Promise<UsageSnapshotResult> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM users) AS "totalUsers",
      (SELECT COUNT(*) FROM users WHERE "lastSignedIn" > NOW() - INTERVAL '7 days') AS "activeUsers7d",
      (SELECT COUNT(*) FROM users WHERE "lastSignedIn" > NOW() - INTERVAL '30 days') AS "activeUsers30d",
      (SELECT COUNT(DISTINCT "userId") FROM locations WHERE "deletedAt" IS NULL) AS "usersWithLocations",
      (SELECT COUNT(DISTINCT "userId") FROM locations WHERE "deletedAt" IS NULL AND "recordedAt" > NOW() - INTERVAL '7 days') AS "activeLoggers7d",
      (SELECT COUNT(*) FROM locations WHERE "deletedAt" IS NULL AND note IS NOT NULL) AS "placeNotes",
      (SELECT COUNT(*) FROM encounters) AS "encounters",
      (SELECT COUNT(*) FROM events) AS "events",
      (SELECT COUNT(*) FROM event_participations WHERE "deletedAt" IS NULL) AS "participations"
  `);

  const row = rowsFromExecute<UsageCountRow>(result)[0] ?? {};
  const capturedAt = new Date();
  // ★1列でも数値にできなければ throw する（0 で埋めない）
  const counts = Object.fromEntries(
    USAGE_SNAPSHOT_COUNT_KEYS.map((key) => [key, parseUsageCount(key, row[key])]),
  ) as Record<(typeof USAGE_SNAPSHOT_COUNT_KEYS)[number], number>;
  const values = { capturedAt, ...counts };

  const inserted = await db
    .insert(usageSnapshots)
    .values(values)
    .returning({ id: usageSnapshots.id });

  return { id: inserted[0]?.id ?? null, ...values };
}

export function resetDbGrowthAlertFlags(): void {
  alertSentFlags.clear();
}
