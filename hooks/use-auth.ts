import * as Auth from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/lib/api/config";
import { clearAllTokenData } from "@/lib/token-manager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser, useAuth as useClerkAuth, useOAuth, useSignIn } from "@clerk/expo";

function resolveReturnUrl(returnUrl?: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  if (!returnUrl) {
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

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, getToken } = useClerkAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_x" });
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();

  const login = useCallback(
    async (returnUrl?: string, _forceSwitch = false) => {
      try {
        if (returnUrl) {
          if (Platform.OS === "web" && typeof window !== "undefined") {
            localStorage.setItem("auth_return_url", returnUrl);
          } else {
            await AsyncStorage.setItem("auth_return_url", returnUrl);
          }
        }

        if (Platform.OS === "web" && typeof window !== "undefined") {
          if (!signIn || !isSignInLoaded) {
            throw new Error("Sign-in instance is not ready");
          }
          const origin = window.location.origin;
          const redirectComplete = resolveReturnUrl(returnUrl) ?? origin;
          await signIn.authenticateWithRedirect({
            strategy: "oauth_x",
            redirectUrl: origin,
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
    [startOAuthFlow, getToken, signIn, isSignInLoaded],
  );

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("[Auth] Clerk signOut error:", err);
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      await clearAllTokenData();
    }
  }, [signOut]);

  const user: Auth.User | null = clerkUser
    ? {
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
      }
    : null;

  const isAuthenticated = useMemo(() => !!clerkUser, [clerkUser]);

  // Clerkの読み込みが遅い場合、3秒後にログインUIを表示するフォールバック
  const [authReadyTimeout, setAuthReadyTimeout] = useState(false);
  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setAuthReadyTimeout(true), 3000);
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
