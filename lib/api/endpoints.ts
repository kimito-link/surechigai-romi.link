/**
 * API Endpoints
 * 
 * このファイルは各APIエンドポイントへのアクセス関数を提供します。
 * すべてのAPI呼び出しはこのファイルの関数を通じて行います。
 * 
 * @see docs/API-ARCHITECTURE.md
 */

import { apiGet, apiPost, ApiResponse } from "./client";

// =============================================================================
// 型定義
// =============================================================================

/**
 * Twitter Lookup APIのレスポンス型
 */
export interface TwitterLookupResult {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

/**
 * API使用状況のレスポンス型
 */
export interface ApiUsageData {
  endpoint: string;
  count: number;
  lastUsed: string;
}

/**
 * トークンリフレッシュのレスポンス型
 */
export interface TokenRefreshResult {
  accessToken: string;
  expiresAt: number;
}

/**
 * フォローステータスのレスポンス型
 */
export interface FollowStatusResult {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

// =============================================================================
// 認証関連API
// =============================================================================

/**
 * セッションをクリアする
 * 
 * @returns APIレスポンス
 * 
 * @example
 * ```tsx
 * import { clearSession } from "@/lib/api";
 * 
 * const handleLogout = async () => {
 *   await clearSession();
 * };
 * ```
 */
export async function clearSession(): Promise<ApiResponse> {
  return apiPost("/api/auth/clear-session");
}

/**
 * セッションを検証する
 * 
 * @param sessionToken セッショントークン
 * @returns APIレスポンス
 */
export async function validateSession(sessionToken: string): Promise<ApiResponse> {
  return apiPost("/api/auth/session", {
    body: { sessionToken },
  });
}

/**
 * トークンをリフレッシュする
 * 
 * @param refreshToken リフレッシュトークン
 * @returns APIレスポンス
 */
export async function refreshToken(
  refreshToken: string
): Promise<ApiResponse<TokenRefreshResult>> {
  return apiPost<TokenRefreshResult>("/api/twitter/refresh", {
    body: { refreshToken },
  });
}

// =============================================================================
// Twitter関連API
// =============================================================================

/**
 * Twitterユーザーを検索する
 * 
 * @param input ユーザー名またはURL
 * @returns APIレスポンス
 * 
 * @example
 * ```tsx
 * import { lookupTwitterUser } from "@/lib/api";
 * 
 * const result = await lookupTwitterUser("@username");
 * if (result.ok && result.data) {
 *   console.log(result.data.name);
 * }
 * ```
 */
export async function lookupTwitterUser(
  input: string
): Promise<ApiResponse<TwitterLookupResult>> {
  return apiPost<TwitterLookupResult>("/api/twitter/lookup", {
    body: { input },
  });
}

/**
 * フォローステータスを取得する
 * 
 * @param userId ユーザーID
 * @returns APIレスポンス
 */
export async function getFollowStatus(
  userId: string
): Promise<ApiResponse<FollowStatusResult>> {
  return apiGet<FollowStatusResult>(
    `/api/twitter/follow-status?userId=${encodeURIComponent(userId)}`
  );
}

// =============================================================================
// 管理者API
// =============================================================================

/**
 * API使用状況を取得する
 * 
 * @returns APIレスポンス
 * 
 * @example
 * ```tsx
 * import { getApiUsage } from "@/lib/api";
 * 
 * const result = await getApiUsage();
 * if (result.ok && result.data) {
 *   console.log(result.data);
 * }
 * ```
 */
export async function getApiUsage(): Promise<ApiResponse<ApiUsageData[]>> {
  return apiGet<ApiUsageData[]>("/api/admin/api-usage");
}
