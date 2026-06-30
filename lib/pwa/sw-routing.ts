/**
 * Service Worker の fetch ルーティング判定（vitest 可能な純粋関数）。
 */

/** JS バンドルは network-first（古い stale キャッシュで白画面になるのを防ぐ） */
export function isJsBundlePath(pathname: string): boolean {
  if (pathname.startsWith("/_expo/static/js/")) return true;
  if (pathname.endsWith(".js") || pathname.endsWith(".mjs")) return true;
  return false;
}

/** ビルド時に public/sw.js へ埋め込む CACHE_VERSION プレースホルダ */
export const SW_CACHE_VERSION_PLACEHOLDER = "__CACHE_VERSION__";

export function buildSwCacheVersion(commitSha: string): string {
  const safe = commitSha.replace(/[^0-9a-zA-Z._-]/g, "-").slice(0, 40);
  return `v3-${safe || "local"}`;
}
