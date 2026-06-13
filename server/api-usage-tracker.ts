/**
 * Twitter API 使用量追跡ユーティリティ
 * 
 * レート制限の使用状況を記録・集計し、管理者向けダッシュボードに表示
 * データベースにも記録してコスト計算を行う
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import * as apiUsageDb from "./db/api-usage-db";

// メモリ内キャッシュ（サーバー再起動でリセット）
interface ApiUsageEntry {
  endpoint: string;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  timestamp: number;
}

interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  endpoints: Record<string, EndpointStats>;
  lastUpdated: number;
}

interface EndpointStats {
  requests: number;
  limit: number;
  remaining: number;
  resetAt: string;
  usagePercent: number;
}

// メモリ内ストレージ
let usageHistory: ApiUsageEntry[] = [];
let stats: ApiUsageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  rateLimitedRequests: 0,
  endpoints: {},
  lastUpdated: Date.now(),
};

// 履歴の最大保持数
const MAX_HISTORY_SIZE = 1000;

/**
 * API使用量を記録（メモリ + データベース）
 */
export async function recordApiUsage(
  endpoint: string,
  rateLimitInfo: {
    limit: number;
    remaining: number;
    reset: number;
  } | null,
  success: boolean = true,
  method: string = "GET"
): Promise<void> {
  const now = Date.now();
  
  // 統計を更新（メモリ）
  stats.totalRequests++;
  if (success) {
    stats.successfulRequests++;
  } else {
    stats.rateLimitedRequests++;
  }
  stats.lastUpdated = now;
  
  // データベースに記録（非同期、エラーは無視）
  apiUsageDb.recordApiUsage({
    endpoint,
    method,
    success,
    rateLimitInfo,
  }).catch((error) => {
    console.error("[API Usage] Failed to record to database:", error);
  });
  
  // エンドポイント別の統計を更新
  if (rateLimitInfo) {
    const entry: ApiUsageEntry = {
      endpoint,
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      reset: rateLimitInfo.reset,
      timestamp: now,
    };
    
    // 履歴に追加
    usageHistory.push(entry);
    
    // 履歴サイズを制限
    if (usageHistory.length > MAX_HISTORY_SIZE) {
      usageHistory = usageHistory.slice(-MAX_HISTORY_SIZE);
    }
    
    // エンドポイント統計を更新
    const usagePercent = ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit) * 100;
    stats.endpoints[endpoint] = {
      requests: (stats.endpoints[endpoint]?.requests || 0) + 1,
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      resetAt: new Date(rateLimitInfo.reset * 1000).toISOString(),
      usagePercent: Math.round(usagePercent * 10) / 10,
    };
  }
}

/**
 * レート制限エラーを記録
 */
export async function recordRateLimitError(endpoint: string, method: string = "GET"): Promise<void> {
  await recordApiUsage(endpoint, null, false, method);
}

/**
 * 現在のAPI使用量統計を取得
 */
export function getApiUsageStats(): ApiUsageStats {
  return { ...stats };
}

/**
 * エンドポイント別の詳細統計を取得
 */
export function getEndpointStats(endpoint: string): EndpointStats | null {
  return stats.endpoints[endpoint] || null;
}

/**
 * 直近N件の使用履歴を取得
 */
export function getRecentUsageHistory(count: number = 100): ApiUsageEntry[] {
  return usageHistory.slice(-count);
}

/**
 * 統計をリセット
 */
export function resetApiUsageStats(): void {
  usageHistory = [];
  stats = {
    totalRequests: 0,
    successfulRequests: 0,
    rateLimitedRequests: 0,
    endpoints: {},
    lastUpdated: Date.now(),
  };
}

/**
 * レート制限の警告レベルを判定
 */
export function getRateLimitWarningLevel(endpoint: string): "safe" | "warning" | "critical" {
  const endpointStats = stats.endpoints[endpoint];
  
  if (!endpointStats) {
    return "safe";
  }
  
  if (endpointStats.remaining <= 5) {
    return "critical";
  }
  
  if (endpointStats.usagePercent >= 80) {
    return "warning";
  }
  
  return "safe";
}

/**
 * 全エンドポイントの警告サマリーを取得
 */
export function getWarningsSummary(): {
  endpoint: string;
  level: "warning" | "critical";
  remaining: number;
  resetAt: string;
}[] {
  const warnings: {
    endpoint: string;
    level: "warning" | "critical";
    remaining: number;
    resetAt: string;
  }[] = [];
  
  for (const [endpoint, endpointStats] of Object.entries(stats.endpoints)) {
    const level = getRateLimitWarningLevel(endpoint);
    if (level !== "safe") {
      warnings.push({
        endpoint,
        level,
        remaining: endpointStats.remaining,
        resetAt: endpointStats.resetAt,
      });
    }
  }
  
  return warnings;
}

/**
 * ダッシュボード用のサマリーデータを取得（DB情報も含む）
 */
export async function getDashboardSummary(): Promise<{
  stats: ApiUsageStats;
  warnings: ReturnType<typeof getWarningsSummary>;
  recentHistory: ApiUsageEntry[];
  monthlyStats: {
    usage: number;
    cost: number;
    freeTierRemaining: number;
  };
  costLimit: {
    exceeded: boolean;
    currentCost: number;
    limit: number;
    shouldAlert: boolean;
    shouldStop: boolean;
  };
  endpointCosts: Array<{ endpoint: string; count: number; cost: number }>;
}> {
  const monthlyStats = await apiUsageDb.getCurrentMonthStats();
  const costLimit = await apiUsageDb.checkCostLimit();
  
  // 今月のエンドポイント別コストを取得
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const endpointCosts = await apiUsageDb.getUsageByEndpoint(month, 20);

  return {
    stats: getApiUsageStats(),
    warnings: getWarningsSummary(),
    recentHistory: getRecentUsageHistory(20),
    monthlyStats,
    costLimit,
    endpointCosts,
  };
}
