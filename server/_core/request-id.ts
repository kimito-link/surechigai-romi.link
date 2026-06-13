/**
 * server/_core/request-id.ts
 * 
 * リクエストID生成・管理
 * 
 * v6.41: requestId導入
 * - 各リクエストに一意のIDを付与
 * - サーバログと監査ログで追跡可能
 * - クライアントにも返却
 */

import { randomUUID } from "crypto";

/**
 * リクエストIDを生成
 * UUID v4形式（例: "550e8400-e29b-41d4-a716-446655440000"）
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * リクエストIDのヘッダー名
 */
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * レスポンスヘッダー名
 */
export const RESPONSE_REQUEST_ID_HEADER = "x-request-id";
