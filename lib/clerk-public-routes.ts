/**
 * Clerk SDK を読み込まない公開 Web ルート（kimito の middleware 公開ルート相当）。
 * OGP クローラー・共有リンク `/u/*` の初回 JS を軽くする。
 */
const PUBLIC_WEB_PREFIXES = ["/u/"] as const;

export function isPublicWebRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return PUBLIC_WEB_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Web トップ `/` など、未ログイン preview だけ見せるルート。
 * Clerk SDK（~1.2MB）を初回 paint まで defer する。
 */
export function shouldDeferClerkOnWeb(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return path === "/" || path === "/index";
}

function normalizePath(pathname: string): string {
  return pathname.split("?")[0]?.split("#")[0] ?? pathname;
}
