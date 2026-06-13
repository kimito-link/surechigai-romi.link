/**
 * アプリバージョン情報（統一管理）
 * 
 * 本番デプロイ時にこの値を更新し、/api/healthのレスポンスと照合することで
 * 正しいバージョンがデプロイされているか確認できる
 * 
 * バージョン番号の更新手順:
 * 1. このファイルのAPP_VERSIONを更新
 * 2. git push後、本番で/api/healthを確認
 */

export const APP_VERSION = "6.182";

// ビルド時に設定される環境変数（Railway/Vercelで設定）
export const GIT_SHA = process.env.EXPO_PUBLIC_GIT_SHA || "unknown";
export const BUILT_AT = process.env.EXPO_PUBLIC_BUILT_AT || "unknown";

/**
 * バージョン情報をまとめて取得
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    gitSha: GIT_SHA,
    builtAt: BUILT_AT,
  };
}
