/**
 * プロフィール画像 URL の優先順位（X / Clerk 実画像 > kimito.link OGP）。
 */

/** kimito.link が生成する OGP サムネ（ユーザー固有だが X アイコンではない） */
export function isKimitoGeneratedProfileImage(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("kimito.link") &&
      u.pathname.includes("opengraph-image")
    );
  } catch {
    return false;
  }
}

/** X の _normal / _bigger を高解像度に揃える */
export function normalizeTwitterAvatarUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  return url.replace("_normal", "_400x400").replace("_bigger", "_400x400");
}

/** 実アバター（pbs.twimg.com / Clerk CDN 等）を kimito OGP より優先 */
export function pickBestProfileImage(
  ...candidates: (string | null | undefined)[]
): string | null {
  const normalized = candidates
    .map(normalizeTwitterAvatarUrl)
    .filter((u): u is string => Boolean(u));

  const preferred = normalized.filter((u) => !isKimitoGeneratedProfileImage(u));
  if (preferred.length > 0) return preferred[0]!;

  return normalized[0] ?? null;
}
