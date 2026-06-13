/**
 * API Usage Database Functions
 * 
 * API使用量とコストの記録・取得を行うDB関数
 */

import { getDb } from "./index";
import { apiUsage, apiCostSettings, InsertApiUsage, InsertApiCostSettings, type ApiCostSettings } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

// X APIの従量課金設定
const FREE_TIER_LIMIT = 100; // 月100件まで無料
// 要確認: X API公式の従量課金単価に更新すること（100件超過分のUSD/件）
const COST_PER_REQUEST = 0.01;

/**
 * API呼び出しを記録
 */
export async function recordApiUsage(usage: {
  endpoint: string;
  method?: string;
  success: boolean;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  } | null;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[API Usage] Database not available, skipping record");
    return null;
  }

  try {
    // 現在の月を取得（YYYY-MM形式）
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 今月の使用量を取得してコストを計算
    const monthlyUsage = await getMonthlyUsage(month);
    const isFreeTier = monthlyUsage < FREE_TIER_LIMIT;
    const cost = isFreeTier ? 0 : COST_PER_REQUEST;

    const insertData: InsertApiUsage = {
      endpoint: usage.endpoint,
      method: usage.method || "GET",
      success: usage.success ? 1 : 0,
      cost: cost.toString(),
      rateLimitInfo: usage.rateLimitInfo ?? null,
      month,
    };

    const [result] = await db.insert(apiUsage).values(insertData);
    return result.insertId ?? null;
  } catch (error) {
    console.error("[API Usage] Failed to record usage:", error);
    return null;
  }
}

/**
 * 指定月の使用量を取得
 */
export async function getMonthlyUsage(month: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiUsage)
      .where(eq(apiUsage.month, month));

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[API Usage] Failed to get monthly usage:", error);
    return 0;
  }
}

/**
 * 指定月のコストを計算
 */
export async function getMonthlyCost(month: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ totalCost: sql<number>`sum(${apiUsage.cost})` })
      .from(apiUsage)
      .where(eq(apiUsage.month, month));

    return Number(result[0]?.totalCost || 0);
  } catch (error) {
    console.error("[API Usage] Failed to get monthly cost:", error);
    return 0;
  }
}

/**
 * 今月の使用量とコストを取得
 */
export async function getCurrentMonthStats(): Promise<{
  usage: number;
  cost: number;
  freeTierRemaining: number;
}> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const usage = await getMonthlyUsage(month);
  const cost = await getMonthlyCost(month);
  const freeTierRemaining = Math.max(0, FREE_TIER_LIMIT - usage);

  return {
    usage,
    cost,
    freeTierRemaining,
  };
}

/**
 * エンドポイント別の使用量を取得
 */
export async function getUsageByEndpoint(
  month: string,
  limit: number = 20
): Promise<Array<{ endpoint: string; count: number; cost: number }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        endpoint: apiUsage.endpoint,
        count: sql<number>`count(*)`,
        cost: sql<number>`sum(${apiUsage.cost})`,
      })
      .from(apiUsage)
      .where(eq(apiUsage.month, month))
      .groupBy(apiUsage.endpoint)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(limit);

    return result.map((r) => ({
      endpoint: r.endpoint,
      count: r.count,
      cost: Number(r.cost || 0),
    }));
  } catch (error) {
    console.error("[API Usage] Failed to get usage by endpoint:", error);
    return [];
  }
}

/**
 * コスト設定を取得
 */
export async function getCostSettings(): Promise<ApiCostSettings | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(apiCostSettings).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[API Usage] Failed to get cost settings:", error);
    return null;
  }
}

/**
 * コスト設定を更新（初回は作成）
 */
export async function upsertCostSettings(
  settings: Partial<InsertApiCostSettings>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[API Usage] Database not available, skipping upsert");
    return;
  }

  try {
    const existing = await getCostSettings();
    if (existing) {
      await db
        .update(apiCostSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(apiCostSettings.id, existing.id));
    } else {
      await db.insert(apiCostSettings).values({
        monthlyLimit: settings.monthlyLimit || "10.00",
        alertThreshold: settings.alertThreshold || "8.00",
        alertEmail: settings.alertEmail || null,
        autoStop: settings.autoStop || 0,
      });
    }
  } catch (error) {
    console.error("[API Usage] Failed to upsert cost settings:", error);
    throw error;
  }
}

/**
 * コスト上限をチェックし、アラートが必要か判定
 */
export async function checkCostLimit(): Promise<{
  exceeded: boolean;
  currentCost: number;
  limit: number;
  shouldAlert: boolean;
  shouldStop: boolean;
}> {
  const settings = await getCostSettings();
  const currentMonth = await getCurrentMonthStats();

  const limit = settings ? Number(settings.monthlyLimit) : 10.0;
  const alertThreshold = settings ? Number(settings.alertThreshold) : 8.0;
  const autoStop = settings ? settings.autoStop === 1 : false;

  const exceeded = currentMonth.cost >= limit;
  const shouldAlert = currentMonth.cost >= alertThreshold;
  const shouldStop = exceeded && autoStop;

  return {
    exceeded,
    currentCost: currentMonth.cost,
    limit,
    shouldAlert,
    shouldStop,
  };
}

/**
 * API呼び出しが許可されているかチェック（コスト上限による停止チェック）
 */
export async function isApiCallAllowed(): Promise<boolean> {
  const costLimit = await checkCostLimit();
  return !costLimit.shouldStop;
}
