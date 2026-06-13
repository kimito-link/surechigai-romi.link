/**
 * URL Slug Utilities
 * 
 * 外部共有URLのslug生成・パース機能
 * 
 * 設計原則:
 * - twitterId/challengeIdを主キーとする（usernameは主キーにしない）
 * - slugは表示用（不一致でもアクセス可能）
 * - 正規URLへのリダイレクトをサポート
 */

/**
 * 文字列をURL-safeなslugに変換
 * 日本語はそのまま保持（URLエンコードされる）
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // 連続する空白をハイフンに
    .replace(/\s+/g, "-")
    // 特殊文字を除去（日本語、英数字、ハイフン以外）
    .replace(/[^\p{L}\p{N}\-]/gu, "")
    // 連続するハイフンを1つに
    .replace(/-+/g, "-")
    // 先頭・末尾のハイフンを除去
    .replace(/^-|-$/g, "")
    // 長すぎる場合は切り詰め
    .slice(0, 50);
}

/**
 * プロフィール共有URL用のslugを生成
 * 形式: {twitterId}-{username}
 */
export function createProfileSlug(twitterId: string, username?: string): string {
  if (!username) {
    return twitterId;
  }
  const slug = slugify(username);
  return slug ? `${twitterId}-${slug}` : twitterId;
}

/**
 * イベント共有URL用のslugを生成
 * 形式: {challengeId}-{title}
 */
export function createEventSlug(challengeId: number | string, title?: string): string {
  const id = String(challengeId);
  if (!title) {
    return id;
  }
  const slug = slugify(title);
  return slug ? `${id}-${slug}` : id;
}

/**
 * slug付きURLからIDを抽出
 * 例: "12345-kimito-birthday" → "12345"
 */
export function extractIdFromSlug(slugWithId: string): string {
  // 最初のハイフンまでがID
  const match = slugWithId.match(/^(\d+)/);
  return match ? match[1] : slugWithId;
}

/**
 * 正規URLを生成（リダイレクト用）
 */
export function getCanonicalProfileUrl(twitterId: string, username?: string): string {
  const slug = createProfileSlug(twitterId, username);
  return `/u/${slug}`;
}

export function getCanonicalEventUrl(challengeId: number | string, title?: string): string {
  const slug = createEventSlug(challengeId, title);
  return `/e/${slug}`;
}

/**
 * 現在のURLが正規URLと一致するか確認
 */
export function isCanonicalUrl(currentPath: string, canonicalPath: string): boolean {
  // URLデコードして比較
  const decodedCurrent = decodeURIComponent(currentPath);
  const decodedCanonical = decodeURIComponent(canonicalPath);
  return decodedCurrent === decodedCanonical;
}
