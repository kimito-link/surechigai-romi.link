import { eq, desc, and, sql, isNull, or, gte, lte, lt, inArray, asc, ne, like, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema";

import { MySql2Database } from "drizzle-orm/mysql2";

// DB接続プールの型定義
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDB = MySql2Database<typeof schema>;
let _db: DrizzleDB | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // 接続プールの作成（タイムアウト設定付き）
      const dbUrl = new URL(process.env.DATABASE_URL);
      const poolConnection = mysql.createPool({
        host: dbUrl.hostname,
        port: Number(dbUrl.port) || 3306,
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbUrl.pathname.slice(1),
        ssl: dbUrl.searchParams.get("ssl") === "true" ? {} : undefined,
        connectTimeout: 10000,       // 接続タイムアウト 10秒
        waitForConnections: true,
        connectionLimit: 5,          // プールサイズ
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000, // 10秒ごとにKeepAlive
      });
      
      _db = drizzle(poolConnection, { schema, mode: "default" });
      
      // 接続テストを実行（タイムアウト付き）
      try {
        // タイムアウトを設定（5秒）
        const testPromise = poolConnection.query("SELECT 1");
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection test timeout")), 5000)
        );
        
        await Promise.race([testPromise, timeoutPromise]);
        console.log("[Database] Connection pool initialized successfully");
      } catch (testError) {
        console.error("[Database] Connection test failed:", testError);
        // 接続テストに失敗した場合でも、プールは作成済みなので続行
        // 実際のクエリ実行時にエラーが発生する可能性がある
      }
    } catch (error) {
      console.error("[Database] Failed to create connection pool:", error);
      _db = null;
    }
  }
  return _db;
}

// URL用のスラッグを生成する関数
export function generateSlug(title: string): string {
  // 日本語のタイトルをローマ字に変換し、URLフレンドリーなスラッグを作成
  // 例: "生誕祭ライブ 動員100人チャレンジ" -> "birthday-live-100"

  // 日本語のキーワードを英語に変換
  const translations: Record<string, string> = {
    '生誕祭': 'birthday',
    'ライブ': 'live',
    'ワンマン': 'oneman',
    '動員': 'attendance',
    'チャレンジ': 'challenge',
    'フォロワー': 'followers',
    '同時視聴': 'viewers',
    '配信': 'stream',
    'グループ': 'group',
    'ソロ': 'solo',
    'フェス': 'fes',
    '対バン': 'taiban',
    'ファンミーティング': 'fanmeeting',
    'リリース': 'release',
    'イベント': 'event',
    '人': '',
    '万': '0000',
  };

  let slug = title.toLowerCase();

  // 日本語キーワードを英語に変換
  for (const [jp, en] of Object.entries(translations)) {
    slug = slug.replace(new RegExp(jp, 'g'), en);
  }

  // 英字と数字のみを抽出し、ハイフンで結合
  const words = slug.match(/[a-z]+|\d+/g) || [];
  slug = words.join('-');

  // 連続ハイフンを単一に
  slug = slug.replace(/-+/g, '-');

  // 先頭と末尾のハイフンを削除
  slug = slug.replace(/^-|-$/g, '');

  // 空の場合はタイムスタンプを使用
  if (!slug) {
    slug = `challenge-${Date.now()}`;
  }

  return slug;
}

// Re-export drizzle operators for convenience
export { eq, desc, and, sql, isNull, or, gte, lte, lt, inArray, asc, ne, like, count };
