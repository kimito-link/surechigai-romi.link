/**
 * API Error Handling
 * 
 * エラーメッセージの生成とユーティリティ
 */

import type { ApiResponse } from "./types";
export { ApiError } from "./types";

// =============================================================================
// エラーメッセージ
// =============================================================================

/**
 * APIレスポンスからエラーメッセージを取得
 * ユーザーに表示するための日本語メッセージを返す
 */
export function getErrorMessage(response: ApiResponse): string {
  if (response.ok) return "";

  // キューイングされた場合
  if (response.queued) {
    return "オフラインです。ネットワーク復帰後に自動的に送信されます。";
  }

  // ステータスコード別のメッセージ
  switch (response.status) {
    case 0:
      return "ネットワークエラーが発生しました。インターネット接続を確認してください。";
    case 400:
      return "リクエストが不正です。入力内容を確認してください。";
    case 401:
      return "認証が必要です。再度ログインしてください。";
    case 403:
      return "アクセスが拒否されました。";
    case 404:
      return "リソースが見つかりませんでした。";
    case 429:
      return "リクエストが多すぎます。しばらく待ってから再試行してください。";
    case 500:
    case 502:
    case 503:
      return "サーバーエラーが発生しました。しばらく待ってから再試行してください。";
    default:
      return response.error || "エラーが発生しました。";
  }
}

/**
 * APIレスポンスが成功かどうかを型ガードで判定
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { ok: true; data: T } {
  return response.ok && response.data !== null;
}

/**
 * HTTPステータスコードからエラータイプを判定
 */
export function getErrorType(status: number): "network" | "client" | "server" | "unknown" {
  if (status === 0) return "network";
  if (status >= 400 && status < 500) return "client";
  if (status >= 500) return "server";
  return "unknown";
}
