/** ログイン後の既定着地（surechigai のホーム = ポストタブ）。 */
export const DEFAULT_POST_AUTH_PATH = "/";

/**
 * LP・公開ページの「参加する／ログイン」CTA が使う唯一の sign-in URL。
 * redirect_url を付け忘れるとログイン後に迷子になるため single source にする（kimito 準拠）。
 */
export const SIGN_IN_HREF = `/sign-in?redirect_url=${encodeURIComponent(DEFAULT_POST_AUTH_PATH)}`;
export const SIGN_IN_AUTO_X_HREF = `${SIGN_IN_HREF}&auto=x`;
export const SIGN_UP_HREF = SIGN_IN_HREF;

/** パスセグメントベースの SSO コールバック判定（Next.js 互換）。 */
export function isClerkSsoCallback(segments: string[] | undefined): boolean {
  return segments?.includes("sso-callback") ?? false;
}

/** Expo Router + hash routing 向け: URL ハッシュに sso-callback が含まれるか。 */
export function isClerkHashSsoCallback(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.includes("sso-callback");
}

/**
 * 素の `/sign-in`（redirect_url 無し）を正規 href に格上げする。
 * CTA 側の付け忘れを1か所で吸収（kimito upgradeAuthHref 準拠）。
 */
export function upgradeAuthHref(href: string): string {
  if (href === "/sign-in/" || href === "/sign-in") return SIGN_IN_HREF;
  if (href === "/sign-up/" || href === "/sign-up") return SIGN_UP_HREF;
  return href;
}

/** returnTo を付けた sign-in URL を組み立てる。 */
export function buildSignInHref(
  returnTo: string = DEFAULT_POST_AUTH_PATH,
): string {
  return `/sign-in?redirect_url=${encodeURIComponent(returnTo)}`;
}

/** kimito.link と同じ 1 タップ導線: sign-in 着地後に Clerk の X ボタンを自動 click する。 */
export function buildSignInAutoXHref(
  returnTo: string = DEFAULT_POST_AUTH_PATH,
): string {
  return `${buildSignInHref(returnTo)}&auto=x`;
}
