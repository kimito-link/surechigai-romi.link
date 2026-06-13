/**
 * ユーザーフレンドリーなエラーメッセージ変換ユーティリティ
 * データベースエラーやシステムエラーを分かりやすいメッセージに変換
 */

// エラーコードとユーザー向けメッセージのマッピング
export const ERROR_MESSAGES: Record<string, string> = {
  // データベースエラー
  DATABASE_NOT_AVAILABLE: "サーバーに接続できません。しばらく待ってから再度お試しください。",
  DATABASE_CONNECTION_ERROR: "データベースへの接続に失敗しました。しばらく待ってから再度お試しください。",
  DUPLICATE_ENTRY: "すでに登録されているデータです。",
  FOREIGN_KEY_ERROR: "関連するデータが見つかりません。",
  DATA_TOO_LONG: "入力されたデータが長すぎます。",
  
  // 認証エラー
  UNAUTHORIZED: "ログインが必要です。Twitterでログインしてください。",
  FORBIDDEN: "この操作を行う権限がありません。",
  SESSION_EXPIRED: "セッションが切れました。再度ログインしてください。",
  
  // バリデーションエラー
  VALIDATION_ERROR: "入力内容に問題があります。確認してください。",
  REQUIRED_FIELD_MISSING: "必須項目が入力されていません。",
  INVALID_FORMAT: "入力形式が正しくありません。",
  
  // ネットワークエラー
  NETWORK_ERROR: "ネットワーク接続に問題があります。接続を確認してください。",
  TIMEOUT: "サーバーからの応答がありません。しばらく待ってから再度お試しください。",
  
  // 一般エラー
  UNKNOWN_ERROR: "予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
  SERVER_ERROR: "サーバーでエラーが発生しました。しばらく待ってから再度お試しください。",
};

// エラーコードの型
export type ErrorCode = keyof typeof ERROR_MESSAGES;

// エラーレスポンスの型
export interface UserFriendlyError {
  code: ErrorCode;
  message: string;
  details?: string;
  canRetry: boolean;
}

/**
 * 技術的なエラーメッセージをユーザーフレンドリーなメッセージに変換
 */
export function toUserFriendlyError(error: unknown): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // データベース接続エラー
  if (errorMessage.includes("Database not available") || 
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("Connection refused")) {
    return {
      code: "DATABASE_NOT_AVAILABLE",
      message: ERROR_MESSAGES.DATABASE_NOT_AVAILABLE,
      canRetry: true,
    };
  }
  
  // 重複エラー
  if (errorMessage.includes("Duplicate entry") || 
      errorMessage.includes("ER_DUP_ENTRY") ||
      errorMessage.includes("unique constraint")) {
    return {
      code: "DUPLICATE_ENTRY",
      message: ERROR_MESSAGES.DUPLICATE_ENTRY,
      canRetry: false,
    };
  }
  
  // 外部キーエラー
  if (errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("ER_NO_REFERENCED_ROW")) {
    return {
      code: "FOREIGN_KEY_ERROR",
      message: ERROR_MESSAGES.FOREIGN_KEY_ERROR,
      canRetry: false,
    };
  }
  
  // データ長エラー
  if (errorMessage.includes("Data too long") ||
      errorMessage.includes("ER_DATA_TOO_LONG")) {
    return {
      code: "DATA_TOO_LONG",
      message: ERROR_MESSAGES.DATA_TOO_LONG,
      canRetry: false,
    };
  }
  
  // 認証エラー
  if (errorMessage.includes("ログインが必要") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("Not authenticated")) {
    return {
      code: "UNAUTHORIZED",
      message: ERROR_MESSAGES.UNAUTHORIZED,
      canRetry: false,
    };
  }
  
  // 権限エラー
  if (errorMessage.includes("Permission denied") ||
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("権限がありません")) {
    return {
      code: "FORBIDDEN",
      message: ERROR_MESSAGES.FORBIDDEN,
      canRetry: false,
    };
  }
  
  // セッションエラー
  if (errorMessage.includes("Invalid session") ||
      errorMessage.includes("Session expired")) {
    return {
      code: "SESSION_EXPIRED",
      message: ERROR_MESSAGES.SESSION_EXPIRED,
      canRetry: false,
    };
  }
  
  // ネットワークエラー
  if (errorMessage.includes("Network") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("Failed to fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: ERROR_MESSAGES.NETWORK_ERROR,
      canRetry: true,
    };
  }
  
  // タイムアウト
  if (errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT")) {
    return {
      code: "TIMEOUT",
      message: ERROR_MESSAGES.TIMEOUT,
      canRetry: true,
    };
  }
  
  // SQLエラー（一般）
  if (errorMessage.includes("SQL") ||
      errorMessage.includes("ER_") ||
      errorMessage.includes("Failed query")) {
    return {
      code: "DATABASE_CONNECTION_ERROR",
      message: ERROR_MESSAGES.DATABASE_CONNECTION_ERROR,
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      canRetry: true,
    };
  }
  
  // その他のエラー
  return {
    code: "UNKNOWN_ERROR",
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    canRetry: true,
  };
}

/**
 * エラーコードからメッセージを取得
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}
