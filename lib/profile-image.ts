/**
 * プロフィール画像 URL の優先順位（X / Clerk 実画像 > unavatar > なし）。
 * kimito.link OGP は一覧サムネに使わない。
 */

import { normalizeTwitterUsername } from "./twitter-username.js";

/** kimito.link が生成する OGP サムネ（X アイコンではないため一覧では除外） */
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

/** 一覧に使える実アバター URL のみ返す（kimito OGP は常に除外） */
export function pickBestProfileImage(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeTwitterAvatarUrl(candidate);
    if (normalized && !isKimitoGeneratedProfileImage(normalized)) {
      return normalized;
    }
  }
  return null;
}

/** X API が使えないときのフォールバック（pbs.twimg.com へリダイレクト） */
export function buildTwitterAvatarFallbackUrl(
  username: string | null | undefined,
): string | null {
  const clean = normalizeTwitterUsername(username);
  if (!clean) return null;
  return `https://unavatar.io/x/${encodeURIComponent(clean)}`;
}

/** 一覧カード用: 実アバター → unavatar → null（kimito OGP は返さない） */
export function resolveListProfileImage(
  username: string | null | undefined,
  ...candidates: (string | null | undefined)[]
): string | null {
  return (
    pickBestProfileImage(...candidates) ??
    buildTwitterAvatarFallbackUrl(username)
  );
}
