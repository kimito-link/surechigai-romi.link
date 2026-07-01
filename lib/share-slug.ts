/**
 * 共有リンク /u/<slug> 用スラッグ生成。
 * I/l/1/0/O など紛らわしい文字は除外（X 等の UI フォントで誤コピーされやすいため）。
 */

/** 視認性の高い base57 文字集合（紛らわしい 5 文字を除外） */
export const SHARE_SLUG_CHARS =
  "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

const AMBIGUOUS_SHARE_SLUG_CHARS = /[Il10O]/;

export function hasAmbiguousShareSlugChars(slug: string): boolean {
  return AMBIGUOUS_SHARE_SLUG_CHARS.test(slug);
}

/** 12 文字のランダムスラッグ（連番 ID 非公開のため）。 */
export function randomShareSlug(length = 12): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += SHARE_SLUG_CHARS[bytes[i] % SHARE_SLUG_CHARS.length];
  }
  return out;
}
