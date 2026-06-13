/**
 * アプリケーションログユーティリティ
 * 
 * 開発環境でのみログを出力し、本番環境では無効化される
 * v6.23: console.logの代わりに使用
 */

// 開発環境かどうかを判定
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  /** ログのコンテキスト（例: "OAuth", "API", "Auth"） */
  context?: string;
  /** 追加のデータ */
  data?: Record<string, unknown>;
}

/**
 * ログを出力する
 */
function log(level: LogLevel, message: string, options?: LogOptions): void {
  if (!isDev && level !== "error") return;
  
  const prefix = options?.context ? `[${options.context}]` : "";
  const fullMessage = prefix ? `${prefix} ${message}` : message;
  
  switch (level) {
    case "debug":
      console.debug(fullMessage, options?.data ?? "");
      break;
    case "info":
      console.log(fullMessage, options?.data ?? "");
      break;
    case "warn":
      console.warn(fullMessage, options?.data ?? "");
      break;
    case "error":
      console.error(fullMessage, options?.data ?? "");
      break;
  }
}

/**
 * デバッグログ（開発環境のみ）
 */
export function debug(message: string, options?: LogOptions): void {
  log("debug", message, options);
}

/**
 * 情報ログ（開発環境のみ）
 */
export function info(message: string, options?: LogOptions): void {
  log("info", message, options);
}

/**
 * 警告ログ（開発環境のみ）
 */
export function warn(message: string, options?: LogOptions): void {
  log("warn", message, options);
}

/**
 * エラーログ（常に出力）
 */
export function error(message: string, options?: LogOptions): void {
  log("error", message, options);
}

/**
 * コンテキスト付きロガーを作成
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => debug(message, { context, data }),
    info: (message: string, data?: Record<string, unknown>) => info(message, { context, data }),
    warn: (message: string, data?: Record<string, unknown>) => warn(message, { context, data }),
    error: (message: string, data?: Record<string, unknown>) => error(message, { context, data }),
  };
}

// デフォルトエクスポート
export const logger = {
  debug,
  info,
  warn,
  error,
  createLogger,
};

export default logger;
