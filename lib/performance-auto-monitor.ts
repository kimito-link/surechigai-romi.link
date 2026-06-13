/**
 * パフォーマンス計測の自動化
 * 
 * React Queryのグローバル設定を拡張し、全てのクエリのローディング時間を自動計測します。
 * 開発環境でのみ有効化され、Metro Bundlerのコンソールにログを出力します。
 */

import { QueryCache, MutationCache } from "@tanstack/react-query";

// パフォーマンス計測の閾値（ミリ秒）
const SLOW_QUERY_THRESHOLD = 1000; // 1秒以上で警告
const CACHED_QUERY_THRESHOLD = 100; // キャッシュがあるのに100ms以上で警告

// クエリの開始時刻を記録するMap
const queryStartTimes = new Map<string, number>();

/**
 * クエリのパフォーマンスを計測するQueryCache
 */
export function createPerformanceQueryCache() {
  return new QueryCache({
    onSuccess: (data, query) => {
      if (!__DEV__) return;

      const queryKey = JSON.stringify(query.queryKey);
      const startTime = queryStartTimes.get(queryKey);
      
      if (startTime) {
        const duration = Date.now() - startTime;
        const hasCache = query.state.dataUpdateCount > 1;
        
        // ログの出力
        logQueryPerformance(queryKey, duration, hasCache, "success");
        
        // 計測完了後は削除
        queryStartTimes.delete(queryKey);
      }
    },
    onError: (error, query) => {
      if (!__DEV__) return;

      const queryKey = JSON.stringify(query.queryKey);
      const startTime = queryStartTimes.get(queryKey);
      
      if (startTime) {
        const duration = Date.now() - startTime;
        logQueryPerformance(queryKey, duration, false, "error", error);
        queryStartTimes.delete(queryKey);
      }
    },
  });
}

/**
 * Mutationのパフォーマンスを計測するMutationCache
 */
export function createPerformanceMutationCache() {
  return new MutationCache({
    onSuccess: (data, variables, context, mutation) => {
      if (!__DEV__) return;

      const mutationKey = mutation.options.mutationKey 
        ? JSON.stringify(mutation.options.mutationKey)
        : "unknown-mutation";
      
      // Mutationは通常短時間で完了するため、ログは簡略化
      console.log(`[Performance] Mutation ${mutationKey} succeeded`);
    },
    onError: (error, variables, context, mutation) => {
      if (!__DEV__) return;

      const mutationKey = mutation.options.mutationKey 
        ? JSON.stringify(mutation.options.mutationKey)
        : "unknown-mutation";
      
      console.error(`[Performance] Mutation ${mutationKey} failed:`, error);
    },
  });
}

/**
 * クエリのフェッチ開始を記録
 */
export function recordQueryStart(queryKey: unknown[]) {
  if (!__DEV__) return;
  
  const key = JSON.stringify(queryKey);
  queryStartTimes.set(key, Date.now());
}

/**
 * クエリのパフォーマンスログを出力
 */
function logQueryPerformance(
  queryKey: string,
  duration: number,
  hasCache: boolean,
  status: "success" | "error",
  error?: unknown
) {
  // クエリ名を抽出（配列の最初の要素）
  let queryName = "unknown";
  try {
    const parsed = JSON.parse(queryKey);
    if (Array.isArray(parsed) && parsed.length > 0) {
      queryName = Array.isArray(parsed[0]) ? parsed[0].join(".") : String(parsed[0]);
    }
  } catch {
    queryName = queryKey.slice(0, 50); // 長すぎる場合は切り詰め
  }

  // ステータスに応じたログレベル
  if (status === "error") {
    console.error(`[Performance] ❌ ${queryName} failed after ${duration}ms`, error);
    return;
  }

  // 初回ロード vs キャッシュからの更新
  const loadType = hasCache ? "cached" : "initial";
  
  // パフォーマンス警告
  if (!hasCache && duration >= SLOW_QUERY_THRESHOLD) {
    console.warn(
      `[Performance] ⚠️ ${queryName} (${loadType}) took ${duration}ms (> ${SLOW_QUERY_THRESHOLD}ms threshold)`
    );
  } else if (hasCache && duration >= CACHED_QUERY_THRESHOLD) {
    console.warn(
      `[Performance] ⚠️ ${queryName} (${loadType}) took ${duration}ms (> ${CACHED_QUERY_THRESHOLD}ms threshold for cached queries)`
    );
  } else {
    // 正常なパフォーマンス
    const emoji = hasCache ? "⚡" : "✅";
    console.log(`[Performance] ${emoji} ${queryName} (${loadType}) completed in ${duration}ms`);
  }
}

/**
 * 開発環境でのパフォーマンスサマリーを出力
 */
export function logPerformanceSummary() {
  if (!__DEV__) return;
  
  console.log("\n[Performance] Summary:");
  console.log(`  - Active queries: ${queryStartTimes.size}`);
  console.log(`  - Thresholds: ${SLOW_QUERY_THRESHOLD}ms (initial), ${CACHED_QUERY_THRESHOLD}ms (cached)`);
  console.log("");
}
