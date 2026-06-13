/**
 * Twitter Authentication URL Utilities
 * 
 * このファイルはTwitter認証に関連するURL生成を一元管理します。
 * ログイン、ログアウト、アカウント切り替えなど、すべてのTwitter認証フローで
 * このファイルの関数を使用してください。
 * 
 * @see docs/API-ARCHITECTURE.md
 */

import { getApiBaseUrl } from "./config";

// =============================================================================
// Twitter認証エンドポイント
// =============================================================================

/**
 * Twitter認証のAPIエンドポイント
 */
export const TWITTER_AUTH_ENDPOINTS = {
  /** 認証開始 */
  auth: "/api/twitter/auth",
  /** コールバック */
  callback: "/api/twitter/callback",
  /** ログアウト */
  logout: "/api/twitter/logout",
} as const;

// =============================================================================
// URL生成関数
// =============================================================================

/**
 * Twitter認証URLを取得します（通常ログイン）
 * 
 * @returns Twitter認証URL
 * 
 * @example
 * ```tsx
 * import { getTwitterAuthUrl } from "@/lib/api/twitter-auth";
 * 
 * const handleLogin = () => {
 *   window.location.href = getTwitterAuthUrl();
 * };
 * ```
 */
export function getTwitterAuthUrl(): string {
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}${TWITTER_AUTH_ENDPOINTS.auth}`;
}

/**
 * Twitter認証URLを取得します（アカウント切り替え）
 * 
 * switch=trueパラメータを付与することで、Twitterのアカウント選択画面を
 * 強制的に表示します。
 * 
 * @returns Twitter認証URL（アカウント切り替え用）
 * 
 * @example
 * ```tsx
 * import { getTwitterSwitchAccountUrl } from "@/lib/api/twitter-auth";
 * 
 * const handleSwitchAccount = () => {
 *   window.location.href = getTwitterSwitchAccountUrl();
 * };
 * ```
 */
export function getTwitterSwitchAccountUrl(): string {
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}${TWITTER_AUTH_ENDPOINTS.auth}?switch=true`;
}

/**
 * Twitterログアウト後のコールバックURLを取得します
 * 
 * @returns ログアウトコールバックURL
 */
export function getTwitterLogoutCallbackUrl(): string {
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}${TWITTER_AUTH_ENDPOINTS.logout}`;
}

// =============================================================================
// リダイレクト関数
// =============================================================================

/**
 * Twitter認証ページにリダイレクトします（通常ログイン）
 * 
 * @example
 * ```tsx
 * import { redirectToTwitterAuth } from "@/lib/api/twitter-auth";
 * 
 * <Button onPress={redirectToTwitterAuth}>
 *   Twitterでログイン
 * </Button>
 * ```
 */
export function redirectToTwitterAuth(): void {
  if (typeof window !== "undefined") {
    window.location.href = getTwitterAuthUrl();
  }
}

/**
 * Twitter認証ページにリダイレクトします（アカウント切り替え）
 * 
 * @example
 * ```tsx
 * import { redirectToTwitterSwitchAccount } from "@/lib/api/twitter-auth";
 * 
 * <Button onPress={redirectToTwitterSwitchAccount}>
 *   別のアカウントでログイン
 * </Button>
 * ```
 */
export function redirectToTwitterSwitchAccount(): void {
  if (typeof window !== "undefined") {
    window.location.href = getTwitterSwitchAccountUrl();
  }
}

// =============================================================================
// デバッグ用
// =============================================================================

/**
 * Twitter認証URLをログ出力します（デバッグ用）
 */
export function logTwitterAuthUrls(): void {
  if (__DEV__) {
    console.log("[Twitter Auth URLs]", {
      authUrl: getTwitterAuthUrl(),
      switchAccountUrl: getTwitterSwitchAccountUrl(),
      logoutCallbackUrl: getTwitterLogoutCallbackUrl(),
    });
  }
}
