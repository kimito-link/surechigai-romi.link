/**
 * API Configuration
 * 
 * このファイルはAPI関連の設定を一元管理します。
 * すべてのAPI呼び出しはこのファイルの関数を使用してください。
 * 
 * @see docs/API-ARCHITECTURE.md
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

// =============================================================================
// 環境変数
// =============================================================================

const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
};

// =============================================================================
// 本番環境のURL定義
// =============================================================================

/**
 * 本番環境のRailway API URL
 * フロントエンド（Vercel）とバックエンド（Railway）が分離しているため、
 * 本番環境では明示的にRailway URLを指定する必要があります。
 */
export const PRODUCTION_API_URL = "https://doin-challengecom-production.up.railway.app";

/**
 * 本番環境のフロントエンドドメイン
 */
export const PRODUCTION_DOMAINS = [
  "doin-challenge.com",
  "doin-challengecom.vercel.app",
];

// =============================================================================
// API Base URL取得
// =============================================================================

/**
 * API Base URLを取得します。
 * 
 * 優先順位:
 * 1. 環境変数 EXPO_PUBLIC_API_BASE_URL
 * 2. 本番環境ドメインの場合は PRODUCTION_API_URL
 * 3. 開発環境の場合はポート番号を変換（8081 → 3000）
 * 4. フォールバック: 空文字列（相対URL）
 * 
 * @returns API Base URL
 */
export function getApiBaseUrl(): string {
  // 環境変数が設定されている場合はそれを使用
  if (env.apiBaseUrl) {
    return env.apiBaseUrl.replace(/\/$/, "");
  }

  // Web環境: ホスト名から判定
  if (Platform.OS === "web" && typeof location !== "undefined") {
    const protocol = location.protocol;
    const hostname = location.hostname;
    if (isProductionDomain(hostname)) {
      return PRODUCTION_API_URL;
    }
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // Native: expo config または本番URL
  if (Platform.OS !== "web") {
    return Constants.expoConfig?.extra?.apiUrl ?? PRODUCTION_API_URL;
  }

  return "";
}

/**
 * 本番環境ドメインかどうかを判定します。
 * 
 * @param hostname ホスト名
 * @returns 本番環境の場合はtrue
 */
export function isProductionDomain(hostname: string): boolean {
  return PRODUCTION_DOMAINS.some(domain => hostname.includes(domain));
}

// =============================================================================
// デバッグ用
// =============================================================================

/**
 * 現在のAPI設定をログ出力します（デバッグ用）
 */
export function logApiConfig(): void {
  if (__DEV__) {
    console.log("[API Config]", {
      envApiBaseUrl: env.apiBaseUrl,
      resolvedApiBaseUrl: getApiBaseUrl(),
      platform: Platform.OS,
      hostname: Platform.OS === "web" && typeof location !== "undefined" ? location.hostname : "N/A",
    });
  }
}
