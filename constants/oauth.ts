/**
 * OAuth / アプリ設定の定数
 *
 * 注意: ログインはTwitter OAuth 2.0のみ使用。
 */

import { getApiBaseUrl as getApiBaseUrlFromConfig } from "@/lib/api/config";

// Deep Link scheme（iOS/Androidビルド用）。正は app.config.json identity.iosScheme。
// ※現状この deepLinkScheme は未使用（実際の scheme 設定は app.config.ts が
//   app.config.json から読む）。値ズレ混乱を避けるため app.config.json と一致させておく。
const scheme = "surechigai";

const env = {
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: scheme,
};

export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * API Base URLを取得（lib/api/config.ts に委譲）
 */
export function getApiBaseUrl(): string {
  return getApiBaseUrlFromConfig();
}

// ストレージキー
export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";
export const REFRESH_TOKEN_KEY = "twitter_refresh_token";
export const TOKEN_EXPIRES_AT_KEY = "twitter_token_expires_at";
