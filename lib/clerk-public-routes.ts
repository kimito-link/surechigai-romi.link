/**
 * Clerk SDK を読み込まない公開 Web ルート（kimito の middleware 公開ルート相当）。
 * OGP クローラー・共有リンク `/u/*` の初回 JS を軽くする。
 */
const USER_INFO_KEY = "manus-runtime-user-info";
const PUBLIC_WEB_PREFIXES = ["/u/"] as const;

/**
 * Clerk が「ログインしていなくても」書き込む localStorage のキー。セッションの印ではないので、
 * ログイン中ヒントの判定に数えない。
 *
 * ★2026-10-12 実機（moto g64y）で確認: ゲスト（`__client_uat` = 0）の端末にも `__clerk_environment`
 *   （Clerk の環境設定のキャッシュ。約 7KB）が入っていた。以前は「`clerk` を含むキーが1つでもあれば
 *   ログイン中」としていたため、**一度でも Clerk を読み込んだ端末は永久に「ログイン中」扱い**になっていた
 *   （Clerk を読む → このキーが書かれる → 次回もヒントが真になり Clerk を読む、の自己増殖）。
 *   結果、ゲストなのに毎回 Clerk の chunk（約 762KB）と clerk-js を読み、ベールも長引いていた。
 * ★セッションの正本は cookie（`__client_uat` が '0' 以外／`__session`）。localStorage は補助。
 * ★除外リスト方式にしている理由: 未知のキーは従来どおり「ヒントあり」に倒す（ログイン済みなのに
 *   ゲスト画面を見せる側の誤りを避ける）。新しく「ゲストでも書かれるキー」を見つけたらここに足す。
 * ★app/+html.tsx のインラインスクリプト（静的レンダリング用の独立 JS）にも同じリストを埋め込んでいる。
 */
export const NON_SESSION_CLERK_STORAGE_KEYS: readonly string[] = ["__clerk_environment"];

/** localStorage のキーが「Clerk のセッションの印」か（`clerk` を含み、かつ除外リストに無い）。 */
export function isClerkSessionStorageKey(key: string | null | undefined): boolean {
  if (!key) return false;
  if (NON_SESSION_CLERK_STORAGE_KEYS.includes(key)) return false;
  return key.startsWith("__clerk") || key.includes("clerk");
}

/** Guest preview 向けアプリタブ（Clerk セッションなしで閲覧可）。 */
const GUEST_APP_TAB_ROUTES = [
  "/",
  "/index",
  "/checkin",
  "/zukan",
  "/map",
  "/mypage",
] as const;

export function isPublicWebRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return PUBLIC_WEB_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isGuestAppWebRoute(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return GUEST_APP_TAB_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

/**
 * Clerk 非ロードの guest Web シェル（全タブ preview + 公開 `/u/*`）。
 * localStorage に Clerk セッション hint があれば false（ログイン後フルシェル）。
 */
export function shouldUseGuestWebShell(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  if (hasClerkSessionHint()) return false;
  const path = normalizePath(pathname);
  if (path.startsWith("/sign-in")) return false;
  if (isPublicWebRoute(pathname)) return true;
  return isGuestAppWebRoute(pathname);
}

/** Guest トップ `/` だけ tRPC/React Query を初回 paint まで defer。 */
export function shouldDeferTrpcOnGuestWeb(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return path === "/" || path === "/index";
}

/**
 * Web トップ `/` など、未ログイン preview だけ見せるルート。
 * Clerk SDK（~1.2MB）を初回 paint まで defer する。
 * ただし localStorage に Clerk セッションがあれば defer しない（ログイン後の `/` 着地）。
 */
export function shouldDeferClerkOnWeb(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  if (path !== "/" && path !== "/index") return false;
  return !hasClerkSessionHint();
}

/**
 * `.kimito.link` 親ドメインで共有される Clerk 認証 cookie `__client_uat` が
 * 「ログイン済み」を示すか。値は Unix 秒。'0' はゲスト、'0' 以外はログイン済み
 * （中間状態なし）。HttpOnly ではないので document.cookie から読める。
 * exosome (yukkuri-exosome.link/src/js/auth-gate.js) ・kimito.link 本体と
 * 同一ロジック（設計書 DESIGN-kimito-family-prepaint-auth-mode-2026-09-29.md）。
 *
 * ★2026-09-29実損修正: Clerk はドメイン接尾辞付き `__client_uat_<suffix>` を
 *   `__client_uat`（接尾辞無し）と併置することがある（本番実測で確認）。
 *   `.match()`は最初にマッチした1件しか見ないため、`__client_uat_xxx=0;
 *   __client_uat=1234567890`のように接尾辞付きの方が先に出現する並びだと、
 *   実際はログイン済みなのに先頭の`0`だけを見てゲスト誤判定していた
 *   （exosomeの`auth-mode.js`も同型の実装で同じ穴を持つ）。
 *   `matchAll`で全件を見て、いずれか1つでも'0'以外ならログイン済みとする。
 */
function hasLiveClerkUatCookie(): boolean {
  if (typeof document === "undefined") return false;
  const matches = document.cookie.matchAll(/(?:^|;\s*)__client_uat[^=]*=([^;]*)/g);
  for (const m of matches) {
    if (m[1] && m[1] !== "0") return true;
  }
  return false;
}

/** localStorage / cookie の Clerk セッション hint（Guest シェル誤適用の防止）。 */
export function hasClerkSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // ★2026-09-29追加: 他の kimito-link 系サービス（kimito.link本体・exosome等）で
    //   ログイン済みの場合、このドメインの localStorage には何も書かれていないため
    //   従来の判定では見落としていた。`.kimito.link` 共有cookie を最優先で見る。
    if (hasLiveClerkUatCookie()) return true;
    if (window.localStorage.getItem(USER_INFO_KEY)) return true;
    for (let i = 0; i < window.localStorage.length; i++) {
      if (isClerkSessionStorageKey(window.localStorage.key(i))) return true;
    }
    if (
      typeof document !== "undefined" &&
      document.cookie.includes("__session=")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function normalizePath(pathname: string): string {
  return pathname.split("?")[0]?.split("#")[0] ?? pathname;
}
