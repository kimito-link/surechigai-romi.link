/**
 * ログインで使えるプロバイダの「単一の真実」。
 * kimitolink-linktree/lib/auth-providers.ts を Expo 向けに移植。
 */

/**
 * Apple でのログインを出すか。
 *
 * 既定は有効。Clerk インスタンス(clerk.kimito.link)側で oauth_apple は既に enabled で、
 * Web の <SignIn /> は Apple / Google / X の3ボタンを実際に描画している
 * （2026-07-31 に本番DOMで確認）。フラグ未設定を「無効」と扱っていたため、
 * 実態は Apple が使えるのに文言だけ「X だけで安全ログイン」と案内していた。
 *
 * App Store Guideline 4.8 は、サードパーティのソーシャルログインを提供するアプリに
 * 同等の選択肢を求める。Apple ログインはその要件に対する回答でもあるため、
 * 明示的に切りたいときだけ EXPO_PUBLIC_SIWA_ENABLED=false を指定する。
 */
export function isAppleLoginEnabled(): boolean {
  return process.env.EXPO_PUBLIC_SIWA_ENABLED !== "false";
}

export function authProvidersHeadline(variant: "sign-in" | "sign-up"): string {
  const apple = isAppleLoginEnabled();
  if (variant === "sign-in") {
    return apple
      ? "X か Apple で安全ログイン・パスワード不要"
      : "X だけで安全ログイン・パスワード不要";
  }
  return apple
    ? "X か Apple で無料ではじめる・パスワード不要"
    : "X だけで無料ではじめる・パスワード不要";
}
