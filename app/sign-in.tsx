/**
 * /sign-in — kimitolink-linktree のログイン画面と同一 UX。
 *
 * AuthPageShell（2カラム・遷移予告・困ったとき案内・アプリ内ブラウザ警告）+
 * Clerk 標準 `<SignIn />` + hash SSO コールバック時は AuthCallbackShell。
 */

import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { AutoAdvanceToX } from "@/components/auth/auto-advance-to-x";
import { AuthCallbackShell } from "@/components/auth/auth-callback-shell";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ClerkMountFallback } from "@/components/auth/clerk-mount-fallback";
import { ClerkSignIn } from "@/components/organisms/clerk-sign-in";
import { useAuth } from "@/hooks/use-auth";
import { normalizePostAuthRedirect } from "@/lib/auth-redirect-path";
import { isClerkHashSsoCallback } from "@/lib/clerk-route";

function resolveRedirectUrl(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") return "/";
  const param = new URLSearchParams(window.location.search).get("redirect_url");
  return normalizePostAuthRedirect(param);
}

export default function SignInScreen() {
  const redirectUrl = useMemo(resolveRedirectUrl, []);
  const [isCallback, setIsCallback] = useState(() =>
    Platform.OS === "web" ? isClerkHashSsoCallback() : false,
  );
  const { isAuthReady } = useAuth();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const sync = () => setIsCallback(isClerkHashSsoCallback());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // ClerkRootProvider(=<ClerkProvider>) chunk 解決待ちの間に <SignIn /> を描画すると
  // 「SignIn can only be used within the <ClerkProvider />」でクラッシュし、
  // ErrorBoundary が "/" へ丸ごと押し戻す(2026-07-12 実測)。準備完了まではフォールバックのみ描画する。
  const signInBody = isAuthReady ? (
    <ClerkSignIn redirectUrl={redirectUrl} />
  ) : (
    <ClerkMountFallback mode="sign-in" />
  );

  if (isCallback) {
    return (
      <>
        <AutoAdvanceToX />
        <AuthCallbackShell>{signInBody}</AuthCallbackShell>
      </>
    );
  }

  return (
    <>
      <AutoAdvanceToX />
      <AuthPageShell variant="sign-in">{signInBody}</AuthPageShell>
    </>
  );
}
