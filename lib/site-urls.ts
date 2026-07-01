/**
 * 正規 URL — kimito.link ハイブリッド統合。
 * - MARKETING_URL: 紹介・SEO・PageSpeed 計測
 * - APP_ORIGIN: アプリ・PWA・共有 /u/*
 * - STORY_URL: 四季 LP（kimito.link 経由プロキシ）
 */
export const APP_ORIGIN = "https://surechigai.kimito.link" as const;
export const MARKETING_URL = "https://kimito.link/surechigai/" as const;
export const STORY_URL = "https://kimito.link/surechigai/story/" as const;

export function appUrl(path = "/"): string {
  if (!path || path === "/") return `${APP_ORIGIN}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_ORIGIN}${normalized}`;
}

export function shareUserUrl(shareSlug: string): string {
  return `${APP_ORIGIN}/u/${shareSlug}`;
}
