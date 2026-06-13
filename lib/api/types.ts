/**
 * API Client Type Definitions
 * 
 * APIクライアントで使用する型定義
 */

// =============================================================================
// レスポンス型
// =============================================================================

/**
 * APIレスポンスの型
 */
export interface ApiResponse<T = unknown> {
  /** レスポンスが成功したかどうか */
  ok: boolean;
  /** HTTPステータスコード */
  status: number;
  /** レスポンスデータ */
  data: T | null;
  /** エラーメッセージ（エラー時のみ） */
  error: string | null;
  /** キャッシュから取得したかどうか */
  fromCache?: boolean;
  /** オフラインキューに追加されたかどうか */
  queued?: boolean;
}

// =============================================================================
// 設定型
// =============================================================================

/**
 * リトライ設定
 */
export interface RetryConfig {
  /** 最大リトライ回数。デフォルト: 3 */
  maxRetries?: number;
  /** 初期遅延（ミリ秒）。デフォルト: 1000 */
  initialDelay?: number;
  /** 最大遅延（ミリ秒）。デフォルト: 10000 */
  maxDelay?: number;
  /** バックオフ係数。デフォルト: 2 */
  backoffFactor?: number;
  /** リトライ対象のステータスコード。デフォルト: [408, 429, 500, 502, 503, 504] */
  retryableStatuses?: number[];
}

/**
 * キャッシュ設定
 */
export interface CacheConfig {
  /** キャッシュを有効にするか。デフォルト: false */
  enabled?: boolean;
  /** キャッシュの有効期限（ミリ秒）。デフォルト: 300000 (5分) */
  ttl?: number;
  /** キャッシュキー（指定しない場合はエンドポイントから自動生成） */
  key?: string;
  /** オフライン時にキャッシュを使用するか。デフォルト: true */
  useWhenOffline?: boolean;
}

/**
 * APIリクエストオプション
 */
export interface ApiRequestOptions extends Omit<RequestInit, "body" | "cache"> {
  /** リクエストボディ（自動的にJSON.stringifyされる） */
  body?: unknown;
  /** タイムアウト（ミリ秒）。デフォルト: 30000 */
  timeout?: number;
  /** エラー時にコンソールにログを出力するか。デフォルト: true */
  logErrors?: boolean;
  /** リトライ設定 */
  retry?: RetryConfig;
  /** キャッシュ設定 */
  apiCache?: CacheConfig;
  /** オフライン時にキューに追加するか。デフォルト: false */
  queueWhenOffline?: boolean;
}

// =============================================================================
// エラー型
// =============================================================================

/**
 * APIエラーの型
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// =============================================================================
// リトライ設定のデフォルト値
// =============================================================================

export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};
