/**
 * /sign-in — kimitolink-linktree のログイン画面と同一 UX。
 *
 * AuthPageShell（2カラム・遷移予告・困ったとき案内・アプリ内ブラウザ警告）+
 * Clerk 標準 `<SignIn />` + hash SSO コールバック時は AuthCallbackShell。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AddXAccountNotice } from "@/components/auth/add-x-account-notice";
import { AuthCallbackShell } from "@/components/auth/auth-callback-shell";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ClerkMountFallback } from "@/components/auth/clerk-mount-fallback";
import { EulaConsentGate } from "@/components/auth/eula-consent-gate";
import { ClerkSignIn } from "@/components/organisms/clerk-sign-in";
import { useAuth } from "@/hooks/use-auth";
import { normalizePostAuthRedirect } from "@/lib/auth-redirect-path";
import { isClerkHashSsoCallback } from "@/lib/clerk-route";
import { navigateReplace } from "@/lib/navigation";

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
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const nativeParams = useLocalSearchParams<{ redirect_url?: string }>();

  // ★iOS/Android: ログインが終わったら元の画面へ戻す（2026-11-13 実機 554 で発覚）。
  //   ネイティブは認証シートが閉じたあと /sign-in に留まったままで、
  //   「アプリにアクセスを許可」しても次の画面に進まなかった（Web は Clerk が戻り先へ飛ばす）。
  //   開いた時点のユーザーを覚えておき、別のユーザーでログインし終えた瞬間に戻す。
  //   ログイン済みで開いた「アカウントを追加」のときは、同じユーザーのままなので動かない。
  const initialUserKey = useRef<string | null | undefined>(undefined);
  const userKey = isAuthReady ? (isAuthenticated ? (user?.openId ?? "signed-in") : null) : undefined;
  useEffect(() => {
    if (Platform.OS === "web" || userKey === undefined) return;
    if (initialUserKey.current === undefined) {
      initialUserKey.current = userKey;
      return;
    }
    if (userKey && userKey !== initialUserKey.current) {
      const raw = nativeParams.redirect_url;
      navigateReplace.withUrl(normalizePostAuthRedirect(Array.isArray(raw) ? raw[0] : raw));
    }
  }, [userKey, nativeParams.redirect_url]);

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
    return <AuthCallbackShell>{signInBody}</AuthCallbackShell>;
  }

  return (
    <AuthPageShell variant="sign-in">
      {/* ログイン済みで /sign-in が開かれた＝「アカウントを追加」導線。X 側セッションが残ると
          同じ垢に戻るため、先にXを切り替える案内を <SignIn/> の上に出す（設計 A/C）。 */}
      {isAuthenticated ? <AddXAccountNotice /> : null}
      {/* App Store Guideline 1.2: ログイン・登録の前に利用規約（EULA）への同意を求める。
          同意するまでログインボタンは押せない。 */}
      <EulaConsentGate>{signInBody}</EulaConsentGate>
    </AuthPageShell>
  );
}
