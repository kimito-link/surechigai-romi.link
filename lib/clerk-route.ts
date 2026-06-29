/** パスセグメントベースの SSO コールバック判定（Next.js 互換）。 */
export function isClerkSsoCallback(segments: string[] | undefined): boolean {
  return segments?.includes("sso-callback") ?? false;
}

/** Expo Router + hash routing 向け: URL ハッシュに sso-callback が含まれるか。 */
export function isClerkHashSsoCallback(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.includes("sso-callback");
}

export const SIGN_IN_HREF = "/sign-in?redirect_url=%2F";
