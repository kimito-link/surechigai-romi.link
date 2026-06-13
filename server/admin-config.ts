/**
 * 管理者設定
 * 
 * 管理者として認識するTwitter IDのリスト
 * 環境変数 ADMIN_TWITTER_IDS で上書き可能（カンマ区切り）
 */

// デフォルトの管理者Twitter ID（環境変数で上書き可能）
const DEFAULT_ADMIN_TWITTER_IDS: string[] = [
  // ここに管理者のTwitter IDを追加
  // 例: "123456789"
];

/**
 * 管理者Twitter IDのリストを取得
 */
export function getAdminTwitterIds(): string[] {
  const envIds = process.env.ADMIN_TWITTER_IDS;
  if (envIds) {
    return envIds.split(",").map(id => id.trim()).filter(Boolean);
  }
  return DEFAULT_ADMIN_TWITTER_IDS;
}

/**
 * 指定されたTwitter IDが管理者かどうかを判定
 */
export function isAdminTwitterId(twitterId: string | null | undefined): boolean {
  if (!twitterId) return false;
  const adminIds = getAdminTwitterIds();
  return adminIds.includes(twitterId);
}

/**
 * 管理者Twitter IDを追加（ランタイム用、再起動で消える）
 */
export function addAdminTwitterId(twitterId: string): void {
  if (!DEFAULT_ADMIN_TWITTER_IDS.includes(twitterId)) {
    DEFAULT_ADMIN_TWITTER_IDS.push(twitterId);
  }
}
