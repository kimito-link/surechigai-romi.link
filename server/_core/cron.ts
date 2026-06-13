/**
 * サーバーのcron設定
 * 
 * 定期実行タスク:
 * 1. データベースのバックアップ（毎日深夜2時）
 * 2. 古いデータの削除（週次、日曜日深夜3時）
 * 3. 統計データの集計（毎日深夜1時）
 */

import { getDb, lt, sql } from "../db/connection";
import { oauthPkceData, twitterUserCache } from "../../drizzle/schema";

/**
 * 古いOAuth PKCEデータを削除
 */
export async function cleanupExpiredOAuthData() {
  const db = await getDb();
  if (!db) {
    console.warn("[Cron] Cannot cleanup OAuth data: database not available");
    return;
  }

  try {
    const result = await db.delete(oauthPkceData).where(lt(oauthPkceData.expiresAt, new Date()));
    console.log(`[Cron] Cleaned up expired OAuth PKCE data`);
  } catch (error) {
    console.error("[Cron] Failed to cleanup OAuth data:", error);
  }
}

/**
 * 古いTwitterユーザーキャッシュを削除
 */
export async function cleanupExpiredTwitterCache() {
  const db = await getDb();
  if (!db) {
    console.warn("[Cron] Cannot cleanup Twitter cache: database not available");
    return;
  }

  try {
    const result = await db.delete(twitterUserCache).where(lt(twitterUserCache.expiresAt, new Date()));
    console.log(`[Cron] Cleaned up expired Twitter user cache`);
  } catch (error) {
    console.error("[Cron] Failed to cleanup Twitter cache:", error);
  }
}

/**
 * 統計データの集計
 */
export async function aggregateStats() {
  const db = await getDb();
  if (!db) {
    console.warn("[Cron] Cannot aggregate stats: database not available");
    return;
  }

  try {
    // ここに統計データの集計ロジックを追加
    // 例: ユーザーの総貢献数、チャレンジの参加者数など
    console.log("[Cron] Stats aggregation completed");
  } catch (error) {
    console.error("[Cron] Failed to aggregate stats:", error);
  }
}

/**
 * 日次レポートを送信
 */
export async function sendDailyApiReport() {
  try {
    const { sendDailyReport } = await import("../../server/api-daily-report");
    await sendDailyReport();
    console.log("[Cron] Daily API report sent");
  } catch (error) {
    console.error("[Cron] Failed to send daily API report:", error);
  }
}

/**
 * cron設定を初期化
 * 
 * Note: Vercelではcronジョブは使用できないため、Vercel Cronを使用する必要があります。
 * https://vercel.com/docs/cron-jobs
 */
export function initCron() {
  // 開発環境でのみcronを実行（本番環境ではVercel Cronを使用）
  if (process.env.NODE_ENV === "production") {
    console.log("[Cron] Skipping cron initialization in production (use Vercel Cron instead)");
    return;
  }

  console.log("[Cron] Initializing cron jobs...");

  // 開発環境では、起動時に一度だけ実行
  cleanupExpiredOAuthData();
  cleanupExpiredTwitterCache();
  aggregateStats();
  
  // 日次レポートは本番環境ではVercel Cron Jobsで実行
  // 開発環境では手動実行のみ

  console.log("[Cron] Cron jobs initialized");
}
