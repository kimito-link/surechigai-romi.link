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

/**
 * 「JSを頼んだのに HTML が返ってきた」かどうか。
 *
 * ★2026-09-06 の実機不具合の中核:
 *   サーバーが存在しないチャンクに index.html を **HTTP 200** で返していたため、
 *   ブラウザが HTML を ES module として実行できず
 *   「Loading module ... failed」で画面が固まった。
 *   さらに Cache-Control: immutable が付いていたのでリロードしても直らなかった。
 *
 *   サーバー側は dist/404.html で修正済みだが、Service Worker がその壊れた応答を
 *   キャッシュすると端末側に居座って同じ状態が再現する。多層で守るための判定。
 */
export function isHtmlResponseForScript(
  pathname: string,
  contentType: string | null,
): boolean {
  if (!isJsBundlePath(pathname)) return false;
  if (!contentType) return false;
  return contentType.toLowerCase().includes("text/html");
}

/** JSバンドルの取得に失敗したときに返す本文。★JSONを返してはいけない */
export const SW_OFFLINE_SCRIPT_BODY = "/* offline: module unavailable */";

/** その応答の Content-Type。JSとして解釈できる型でなければ二次被害を生む */
export const SW_OFFLINE_SCRIPT_CONTENT_TYPE =
  "application/javascript; charset=utf-8";
