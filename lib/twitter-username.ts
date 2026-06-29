/**
 * X (Twitter) ユーザー名の正規化・検証。
 * 表示名（例: 君斗りんく@クリエイター応援）を username として誤採用しない。
 */

/** X 公式の username 形式（1〜15文字、英数字と _） */
export function isValidTwitterUsername(value: string | null | undefined): boolean {
  if (!value) return false;
  const clean = value.replace(/^@/, "").trim();
  return /^[A-Za-z0-9_]{1,15}$/.test(clean);
}

export function normalizeTwitterUsername(value: string | null | undefined): string | null {
  if (!isValidTwitterUsername(value)) return null;
  return value!.replace(/^@/, "").trim();
}

/** shareSlug が /u/<slug> で使える形式か */
export function isValidShareSlug(slug: string | null | undefined): slug is string {
  if (!slug) return false;
  return /^[A-Za-z0-9]{1,16}$/.test(slug);
}
