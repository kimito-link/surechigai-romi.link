import * as Auth from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/lib/api/config";
import { clearAllTokenData } from "@/lib/token-manager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser, useAuth as useClerkAuth, useOAuth, getClerkInstance } from "@clerk/expo";

function resolveReturnUrl(returnUrl?: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  // onPress={login} のように渡されると第1引数に press イベントが入りうる。
  // 文字列でなければ returnUrl 指定なしとして扱う（returnUrl.startsWith クラッシュ防止）。
  if (typeof returnUrl !== "string" || !returnUrl) {
    return undefined;
  }
  const origin = window.location.origin;
  const normalized =
    returnUrl.startsWith("/(tabs)/") ? returnUrl.replace("/(tabs)/", "/") : returnUrl;
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${origin}${withLeadingSlash}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildUserFromClerk(clerkUser: any): Auth.User | null {
  if (!clerkUser) return null;
  return {
    id: 0,
    openId: `clerk:${clerkUser.id}`,
    name:
      clerkUser.fullName ||
      clerkUser.username ||
      clerkUser.externalAccounts?.[0]?.username ||
      null,
    email: clerkUser.primaryEmailAddress?.emailAddress || null,
    loginMethod: "twitter",
    lastSignedIn: new Date(),
    username:
      clerkUser.externalAccounts?.[0]?.username ||
      clerkUser.username ||
      undefined,
    profileImage: clerkUser.imageUrl || undefined,
  };
}

let globalAuthReady = false;
let cachedUser: Auth.User | null = null;
let cachedIsAuthenticated = false;

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkIsLoaded } = useUser();
  
  if (clerkIsLoaded) {
    globalAuthReady = true;
    cachedIsAuthenticated = !!clerkUser;
    cachedUser = buildUserFromClerk(clerkUser);
  }
  
  const isLoaded = clerkIsLoaded || globalAuthReady;
  const { signOut, getToken } = useClerkAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_x" });

  const login = useCallback(
    async (returnUrl?: string, _forceSwitch = false) => {
      try {
        // onPress={login} 経由だと press イベントが returnUrl に入る。文字列のみ採用する。
        const safeReturnUrl = typeof returnUrl === "string" ? returnUrl : undefined;
        if (safeReturnUrl) {
          if (Platform.OS === "web" && typeof window !== "undefined") {
            localStorage.setItem("auth_return_url", safeReturnUrl);
          } else {
            await AsyncStorage.setItem("auth_return_url", safeReturnUrl);
          }
        }

        if (Platform.OS === "web" && typeof window !== "undefined") {
          const origin = window.location.origin;
          const redirectComplete = resolveReturnUrl(safeReturnUrl) ?? origin;

          // 方式A(Clerk Satellite): このアプリがサテライトのとき、サインインは
          // サテライト側で開始できない(Clerk が 403 "not allowed on a satellite domain")。
          // ★手動で primary の URL へ飛ばすのはNG。Clerk.buildSignInUrl() を使うと
          //   __clerk_synced パラメータが自動付与され、primary でログイン後にサテライトへ
          //   戻った時に SDK がセッションを同期する(これが無いとログイン状態が渡らない)。
          const isSatellite = process.env.EXPO_PUBLIC_CLERK_IS_SATELLITE === "true";
          if (isSatellite) {
            const clerk = getClerkInstance();
            if (typeof clerk.buildSignInUrl !== "function") {
              throw new Error("認証の準備中です。少し待ってからもう一度お試しください。");
            }
            // 認証完了後にこのサテライトの最終遷移先へ戻す
            const syncedSignInUrl = clerk.buildSignInUrl({
              redirectUrl: redirectComplete,
            });
            window.location.href = syncedSignInUrl;
            return;
          }

          // 非サテライト(単独インスタンス)は従来どおり、同じタブのまま X へ遷移する。
          // （useOAuth().startOAuthFlow は Web だと expo-web-browser のポップアップを開き使いづらい。
          //   また useSignIn() の新 signals 版 signIn には authenticateWithRedirect が無い＝
          //   従来の clerk.client.signIn を使う必要がある）
          const clerk = getClerkInstance();
          const clientSignIn = clerk.client?.signIn;
          if (!clientSignIn) {
            throw new Error("認証の準備中です。少し待ってからもう一度お試しください。");
          }
          await clientSignIn.authenticateWithRedirect({
            strategy: "oauth_x",
            // X 認証後に Clerk が一旦受ける先（origin に戻す）
            redirectUrl: origin,
            // 認証完了後に最終的に戻すアプリURL
            redirectUrlComplete: redirectComplete,
          });
          return;
        }

        const redirectUrl = `${getApiBaseUrl()}/oauth/twitter-callback`;

        const result = await startOAuthFlow({ redirectUrl });

        if (result.createdSessionId && result.setActive) {
          await result.setActive({ session: result.createdSessionId });
          // バックエンドにユーザーを同期
          const token = await getToken();
          if (token) {
            try {
              await fetch(`${getApiBaseUrl()}/api/auth/sync`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });
            } catch (syncErr) {
              console.warn("[Auth] Backend sync failed:", syncErr);
            }
          }
        }
      } catch (err) {
        console.error("[Auth] OAuth login error:", err);
      }
    },
    [startOAuthFlow, getToken],
  );

  const logout = useCallback(async () => {
    try {
      await signOut();
      cachedUser = null;
      cachedIsAuthenticated = false;
    } catch (err) {
      console.error("[Auth] Clerk signOut error:", err);
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      await clearAllTokenData();
    }
  }, [signOut]);

  const user = useMemo(() => {
    if (clerkIsLoaded) {
      return buildUserFromClerk(clerkUser);
    }
    return cachedUser;
  }, [clerkUser, clerkIsLoaded]);

  const isAuthenticated = useMemo(() => {
    if (clerkIsLoaded) {
      return !!clerkUser;
    }
    return cachedIsAuthenticated;
  }, [clerkUser, clerkIsLoaded]);

  // Clerkの読み込みが遅い場合、1秒後にログインUIを表示するフォールバック
  const [authReadyTimeout, setAuthReadyTimeout] = useState(false);
  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setAuthReadyTimeout(true), 1000);
    return () => clearTimeout(t);
  }, [isLoaded]);
  const isAuthReadyForUI = isLoaded || authReadyTimeout;

  return {
    user,
    loading: !isLoaded,
    error: null,
    isAuthenticated,
    isAuthReady: isLoaded,
    isAuthReadyForUI,
    refresh: async () => {},
    logout,
    login,
  };
}
