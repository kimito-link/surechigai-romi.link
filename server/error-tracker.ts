/**
 * エラーログトラッカー
 * 
 * アプリケーションで発生したエラーを記録・管理
 * 直近のエラーをメモリに保存し、管理画面から確認可能
 */

export interface ErrorLog {
  id: string;
  timestamp: Date;
  category: "database" | "api" | "auth" | "twitter" | "validation" | "unknown";
  message: string;
  stack?: string;
  context?: {
    endpoint?: string;
    method?: string;
    userId?: number;
    requestBody?: any;
    query?: any;
    headers?: Record<string, string | undefined>;
  };
  resolved: boolean;
  // AI分析結果
  aiAnalysis?: {
    cause: string;
    solution: string;
    codeExample?: string;
    severity: "low" | "medium" | "high" | "critical";
    category: string;
    confidence: number;
    model: string;
    analyzedAt: Date;
  };
  aiAnalyzing?: boolean;  // AI分析中フラグ
}

import { analyzeErrorWithCache, type ErrorAnalysis } from "./ai-error-analyzer";

// エラーログの最大保存件数
const MAX_ERROR_LOGS = 100;

// メモリ内エラーログストレージ
let errorLogs: ErrorLog[] = [];

// AI分析をバックグラウンドで実行
async function triggerAiAnalysis(errorId: string): Promise<void> {
  const errorLog = errorLogs.find(l => l.id === errorId);
  if (!errorLog) return;
  
  // 既に分析済みまたは分析中ならスキップ
  if (errorLog.aiAnalysis || errorLog.aiAnalyzing) return;
  
  // 分析中フラグをセット
  errorLog.aiAnalyzing = true;
  
  try {
    const analysis = await analyzeErrorWithCache({
      message: errorLog.message,
      stack: errorLog.stack,
      category: errorLog.category,
      context: errorLog.context as Record<string, unknown> | undefined,
    });
    
    if (analysis) {
      errorLog.aiAnalysis = analysis;
      console.log(`[ErrorTracker] AI分析完了: ${errorId}`);
      console.log(`  原因: ${analysis.cause}`);
      console.log(`  解決策: ${analysis.solution}`);
    }
  } catch (err) {
    console.error(`[ErrorTracker] AI分析失敗: ${errorId}`, err);
  } finally {
    errorLog.aiAnalyzing = false;
  }
}

// エラーIDを生成
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// エラーカテゴリを推測
function inferCategory(error: Error, context?: ErrorLog["context"]): ErrorLog["category"] {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || "";
  
  // データベース関連
  if (
    message.includes("database") ||
    message.includes("mysql") ||
    message.includes("tidb") ||
    message.includes("connection") ||
    message.includes("query") ||
    stack.includes("drizzle") ||
    stack.includes("pg") ||
    stack.includes("mysql2")
  ) {
    return "database";
  }
  
  // Twitter API関連
  if (
    message.includes("twitter") ||
    message.includes("rate limit") ||
    message.includes("oauth") ||
    stack.includes("twitter")
  ) {
    return "twitter";
  }
  
  // 認証関連
  if (
    message.includes("auth") ||
    message.includes("session") ||
    message.includes("token") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    context?.endpoint?.includes("/auth")
  ) {
    return "auth";
  }
  
  // バリデーション関連
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("zod")
  ) {
    return "validation";
  }
  
  // API関連
  if (
    context?.endpoint ||
    message.includes("api") ||
    message.includes("request") ||
    message.includes("response")
  ) {
    return "api";
  }
  
  return "unknown";
}

// エラーを記録
export function logError(
  error: Error | string,
  context?: ErrorLog["context"],
  category?: ErrorLog["category"]
): ErrorLog {
  const errorObj = typeof error === "string" ? new Error(error) : error;
  
  const errorLog: ErrorLog = {
    id: generateErrorId(),
    timestamp: new Date(),
    category: category || inferCategory(errorObj, context),
    message: errorObj.message,
    stack: errorObj.stack,
    context: context ? {
      ...context,
      // センシティブな情報をマスク
      headers: context.headers ? Object.fromEntries(
        Object.entries(context.headers).map(([k, v]) => [
          k,
          ["authorization", "cookie"].includes(k.toLowerCase()) && v ? "***" : v
        ])
      ) : undefined,
      requestBody: context.requestBody ? maskSensitiveData(context.requestBody) : undefined,
    } : undefined,
    resolved: false,
  };
  
  // ログに追加（先頭に）
  errorLogs.unshift(errorLog);
  
  // 最大件数を超えたら古いものを削除
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOGS);
  }
  
  // コンソールにも出力
  console.error(`[ErrorTracker] ${errorLog.category.toUpperCase()}: ${errorLog.message}`);
  if (errorLog.context?.endpoint) {
    console.error(`  Endpoint: ${errorLog.context.method || "GET"} ${errorLog.context.endpoint}`);
  }
  
  // AI分析をバックグラウンドで実行
  triggerAiAnalysis(errorLog.id);
  
  return errorLog;
}

// センシティブなデータをマスク
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;
  
  const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "cookie"];
  const masked: any = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      masked[key] = "***";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

// エラーログを取得
export function getErrorLogs(options?: {
  category?: ErrorLog["category"];
  limit?: number;
  resolved?: boolean;
}): ErrorLog[] {
  let logs = [...errorLogs];
  
  if (options?.category) {
    logs = logs.filter(log => log.category === options.category);
  }
  
  if (options?.resolved !== undefined) {
    logs = logs.filter(log => log.resolved === options.resolved);
  }
  
  if (options?.limit) {
    logs = logs.slice(0, options.limit);
  }
  
  return logs;
}

// エラーログを解決済みにマーク
export function resolveError(errorId: string): boolean {
  const log = errorLogs.find(l => l.id === errorId);
  if (log) {
    log.resolved = true;
    return true;
  }
  return false;
}

// すべてのエラーを解決済みにマーク
export function resolveAllErrors(): number {
  const count = errorLogs.filter(l => !l.resolved).length;
  errorLogs.forEach(log => log.resolved = true);
  return count;
}

// エラーログをクリア
export function clearErrorLogs(): number {
  const count = errorLogs.length;
  errorLogs = [];
  return count;
}

// エラー統計を取得
export function getErrorStats(): {
  total: number;
  unresolved: number;
  byCategory: Record<ErrorLog["category"], number>;
  recentErrors: number; // 直近1時間
} {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const byCategory: Record<ErrorLog["category"], number> = {
    database: 0,
    api: 0,
    auth: 0,
    twitter: 0,
    validation: 0,
    unknown: 0,
  };
  
  errorLogs.forEach(log => {
    byCategory[log.category]++;
  });
  
  return {
    total: errorLogs.length,
    unresolved: errorLogs.filter(l => !l.resolved).length,
    byCategory,
    recentErrors: errorLogs.filter(l => l.timestamp >= oneHourAgo).length,
  };
}

// Express用エラーハンドリングミドルウェア
export function errorTrackingMiddleware(
  err: Error,
  req: any,
  res: any,
  next: any
) {
  logError(err, {
    endpoint: req.originalUrl || req.url,
    method: req.method,
    userId: req.user?.id,
    requestBody: req.body,
    query: req.query,
    headers: {
      "user-agent": req.headers["user-agent"],
      "content-type": req.headers["content-type"],
      origin: req.headers.origin,
    },
  });
  
  next(err);
}
