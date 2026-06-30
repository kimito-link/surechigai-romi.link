/**
 * Clerk SDK を読み込まない公開 Web ルート（kimito の middleware 公開ルート相当）。
 * OGP クローラー・共有リンク `/u/*` の初回 JS を軽くする。
 */
const PUBLIC_WEB_PREFIXES = ["/u/"] as const;

/** Guest preview 向けアプリタブ（Clerk セッションなしで閲覧可）。 */
const GUEST_APP_TAB_ROUTES = [
  "/",
  "/index",
  "/checkin",
  "/events",
  "/zukan",
  "/map",
  "/mypage",
] as const;

export function isPublicWebRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return PUBLIC_WEB_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isGuestAppWebRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return GUEST_APP_TAB_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

/**
 * Clerk 非ロードの guest Web シェル（全タブ preview + 公開 `/u/*`）。
 * localStorage に Clerk セッション hint があれば false（ログイン後フルシェル）。
 */
export function shouldUseGuestWebShell(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (hasClerkSessionHint()) return false;
  const path = normalizePath(pathname);
  if (path.startsWith("/sign-in")) return false;
  if (isPublicWebRoute(pathname)) return true;
  return isGuestAppWebRoute(pathname);
}

/** Guest トップ `/` だけ tRPC/React Query を初回 paint まで defer。 */
export function shouldDeferTrpcOnGuestWeb(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return path === "/" || path === "/index";
}

/**
 * Web トップ `/` など、未ログイン preview だけ見せるルート。
 * Clerk SDK（~1.2MB）を初回 paint まで defer する。
 * ただし localStorage に Clerk セッションがあれば defer しない（ログイン後の `/` 着地）。
 */
export function shouldDeferClerkOnWeb(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  if (path !== "/" && path !== "/index") return false;
  return !hasClerkSessionHint();
}

/** localStorage の Clerk キー有無（Guest シェル誤適用の防止）。 */
export function hasClerkSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith("__clerk") || key.includes("clerk"))) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function normalizePath(pathname: string): string {
  return pathname.split("?")[0]?.split("#")[0] ?? pathname;
}
