/**
 * ログインで使えるプロバイダの「単一の真実」。
 * kimitolink-linktree/lib/auth-providers.ts を Expo 向けに移植。
 */

export function isAppleLoginEnabled(): boolean {
  return process.env.EXPO_PUBLIC_SIWA_ENABLED === "true";
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
