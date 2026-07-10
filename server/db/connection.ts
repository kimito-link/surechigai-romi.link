/**
 * Database Connection
 *
 * drizzle-orm/postgres-js (postgres.js) を使った Railway PostgreSQL 接続。
 * DATABASE_URL 未設定でもサーバーが起動できるよう graceful に扱う。
 */

import { eq, desc, and, sql, isNull, or, gte, lte, lt, inArray, asc, ne, like, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../drizzle/schema/index.js";

type DrizzleDB = PostgresJsDatabase<typeof schema>;
let _db: DrizzleDB | null = null;

/**
 * Lazily create the drizzle instance so local tooling can run without a DB.
 */
export async function getDb(): Promise<DrizzleDB | null> {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // DATABASE_URL 未設定: サーバー起動は許可、DB操作は全てスキップ
    return null;
  }

  try {
    // postgres.js は動的 import でサーバーサイドのみロードする
    const postgres = (await import("postgres")).default;

    const client = postgres(databaseUrl, {
      max: 2,                    // Vercel 関数のスパイク時に DB 接続を増やしすぎない
      idle_timeout: 10,          // アイドル接続タイムアウト（秒）
      connect_timeout: 3,        // 接続詰まりで関数を長く待たせない
      ssl: databaseUrl.includes("sslmode=require") || databaseUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : false,
    });

    _db = drizzle(client, { schema });

    // 接続テスト
    try {
      await _db.execute(sql`SELECT 1`);
      console.log("[Database] Connection pool initialized successfully (postgres.js)");
    } catch (testError) {
      console.error("[Database] Connection test failed:", testError);
      // テスト失敗でも _db は維持（クエリ時にエラーが出る）
    }
  } catch (error) {
    console.error("[Database] Failed to create connection pool:", error);
    _db = null;
  }

  return _db;
}

/**
 * 書き込み系(mutation)用: DB未接続を「成功」と偽装しない(P1-4)。
 * getDb() が null なら INTERNAL_SERVER_ERROR を投げる。
 * "Database not available" はクライアント toUserFriendlyError が
 * DATABASE_NOT_AVAILABLE(再試行可)に写す既知文言。
 * 読み取り系のフォールバック(空配列/null返し)には使わず、従来どおり getDb() を使う。
 */
export async function requireDb(): Promise<DrizzleDB> {
  const db = await getDb();
  if (!db) {
    const { TRPCError } = await import("@trpc/server");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
  return db;
}

// URL用のスラッグを生成する関数（互換性のため残す）
export function generateSlug(title: string): string {
  const translations: Record<string, string> = {
    'すれ違い': 'surechigai',
    'ロミ': 'romi',
    'エリア': 'area',
    '地域': 'region',
    '生誕祭': 'birthday',
    'ライブ': 'live',
    'ワンマン': 'oneman',
    '動員': 'attendance',
    'チャレンジ': 'challenge',
    'フォロワー': 'followers',
    '配信': 'stream',
    'グループ': 'group',
    'ソロ': 'solo',
    'フェス': 'fes',
    'イベント': 'event',
    '人': '',
    '万': '0000',
  };

  let slug = title.toLowerCase();

  for (const [jp, en] of Object.entries(translations)) {
    slug = slug.replace(new RegExp(jp, 'g'), en);
  }

  const words = slug.match(/[a-z]+|\d+/g) || [];
  slug = words.join('-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');

  if (!slug) {
    slug = `area-${Date.now()}`;
  }

  return slug;
}

// Re-export drizzle operators for convenience
export { eq, desc, and, sql, isNull, or, gte, lte, lt, inArray, asc, ne, like, count };
