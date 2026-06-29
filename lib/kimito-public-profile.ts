/**
 * kimito.link 公開ページ HTML からプロフィール情報を抽出（純関数・テスト用）。
 * 例: https://kimito.link/streamerfunch/
 */

import { normalizeTwitterUsername } from "./twitter-username";

export type KimitoPublicProfile = {
  username: string;
  displayName: string | null;
  profileImage: string | null;
  followersCount: number | null;
  profileUrl: string;
};

export function parseUsernameFromKimitoTitle(title: string): string | null {
  const m = /\(@([A-Za-z0-9_]{1,15})\)/.exec(title);
  return m ? normalizeTwitterUsername(m[1]) : null;
}

export function parseFollowersFromKimitoHtml(html: string): number | null {
  const m = /(\d[\d,]*)[\s\S]{0,40}?フォロワー/.exec(html);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseOgMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = re.exec(html);
  return m?.[1]?.trim() ?? null;
}

/** kimito.link 公開 HTML からプロフィールをパースする。 */
export function parseKimitoPublicProfileHtml(
  html: string,
  username: string,
): KimitoPublicProfile | null {
  const clean = normalizeTwitterUsername(username);
  if (!clean) return null;

  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  const title = titleMatch?.[1]?.trim() ?? "";
  const parsedUsername = parseUsernameFromKimitoTitle(title) ?? clean;

  const ogTitle = parseOgMeta(html, "og:title");
  const displayName =
    ogTitle?.replace(/\s*\(@[A-Za-z0-9_]+\)\s*\|\s*kimito\.link\s*$/i, "").trim() ||
    title.replace(/\s*\(@[A-Za-z0-9_]+\)\s*\|\s*kimito\.link\s*$/i, "").trim() ||
    null;

  const profileImage = parseOgMeta(html, "og:image");
  const followersCount = parseFollowersFromKimitoHtml(html);

  return {
    username: parsedUsername,
    displayName: displayName || null,
    profileImage,
    followersCount,
    profileUrl: `https://kimito.link/${parsedUsername}/`,
  };
}
