/**
 * Clerk hooks → AuthContext（clerk-root-provider chunk 内でのみ import される）。
 */
import * as Auth from "@/lib/_core/auth";
import { USER_INFO_KEY } from "@/constants/oauth";
import { getApiBaseUrl } from "@/lib/api/config";
import { clearAllTokenData } from "@/lib/token-manager";
import { buildSignInAutoXHref } from "@/lib/clerk-route";
import { AuthContextProvider, type AuthState } from "@/lib/auth-context";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useUser,
  useAuth as useClerkAuth,
  useOAuth,
  useClerk,
} from "@clerk/expo";

export function resolveReturnUrl(returnUrl?: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  if (typeof returnUrl !== "string" || !returnUrl) {
    return undefined;
  }
  const origin = window.location.origin;
  const normalized = returnUrl.startsWith("/(tabs)/")
    ? returnUrl.replace("/(tabs)/", "/")
    : returnUrl;
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;
  return `${origin}${withLeadingSlash}`;
}

export function resolveReturnPath(returnUrl?: string): string {
  if (typeof window === "undefined") return "/";
  if (typeof returnUrl !== "string" || !returnUrl) return "/";

  const normalized = returnUrl.startsWith("/(tabs)/")
    ? returnUrl.replace("/(tabs)/", "/")
    : returnUrl;
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      if (url.origin !== window.location.origin) return "/";
      return `${url.pathname}${url.search}${url.hash}` || "/";
    } catch {
      return "/";
    }
  }
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function firstNumber(...values: any[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }
  return undefined;
}

async function waitForClerkReady(
  clerk: any,
  timeoutMs = 5000,
): Promise<boolean> {
  if (!clerk) return false;
  if (clerk.loaded) return true;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100));
    if (clerk.loaded) return true;
  }
  return !!clerk.loaded;
}

function getStoredUserSnapshot(): Partial<Auth.User> | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(USER_INFO_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function buildUserFromClerk(clerkUser: any): Auth.User | null {
  if (!clerkUser) return null;
  const storedUser = getStoredUserSnapshot();
  const externalAccount =
    clerkUser.externalAccounts?.find?.((account: any) =>
      ["oauth_x", "oauth_twitter", "twitter"].includes(account.provider),
    ) ?? clerkUser.externalAccounts?.[0];
  const publicMetadata = clerkUser.publicMetadata ?? {};
  const unsafeMetadata = clerkUser.unsafeMetadata ?? {};
  const externalPublicMetadata = externalAccount?.publicMetadata ?? {};

  const username = firstString(
    externalAccount?.username,
    externalAccount?.handle,
    externalAccount?.screenName,
    clerkUser.username,
    publicMetadata.username,
    unsafeMetadata.username,
    storedUser?.username,
  );
  const profileImage = firstString(
    clerkUser.imageUrl,
    externalAccount?.imageUrl,
    externalAccount?.picture,
    publicMetadata.profileImage,
    unsafeMetadata.profileImage,
    storedUser?.profileImage,
  );
  const followersCount = firstNumber(
    publicMetadata.followersCount,
    publicMetadata.followers,
    unsafeMetadata.followersCount,
    unsafeMetadata.followers,
    externalPublicMetadata.followersCount,
    externalPublicMetadata.followers,
    externalAccount?.followersCount,
    storedUser?.followersCount,
  );
  const twitterId = firstString(
    externalAccount?.providerUserId,
    externalAccount?.externalId,
    externalAccount?.id,
    publicMetadata.twitterId,
    unsafeMetadata.twitterId,
    storedUser?.twitterId,
  );

  return {
    id: 0,
    openId: `clerk:${clerkUser.id}`,
    name: clerkUser.fullName || username || storedUser?.name || null,
    email: clerkUser.primaryEmailAddress?.emailAddress || null,
    loginMethod: "twitter",
    lastSignedIn: new Date(),
    username,
    profileImage,
    followersCount,
    twitterId,
  };
}

export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkIsLoaded } = useUser();
  const { signOut, getToken } = useClerkAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_x" });
  const clerk = useClerk();

  const login = useCallback(
    async (returnUrl?: string, forceSwitch = false) => {
      try {
        const safeReturnUrl =
          typeof returnUrl === "string" ? returnUrl : undefined;
        if (safeReturnUrl) {
          if (Platform.OS === "web" && typeof window !== "undefined") {
            localStorage.setItem("auth_return_url", safeReturnUrl);
          } else {
            await AsyncStorage.setItem("auth_return_url", safeReturnUrl);
          }
        }

        if (forceSwitch) {
          try {
            await signOut();
            await Auth.removeSessionToken();
            await Auth.clearUserInfo();
            await clearAllTokenData();
          } catch (signOutErr) {
            console.warn(
              "[Auth] signOut before account switch failed:",
              signOutErr,
            );
          }
        }

        if (Platform.OS === "web" && typeof window !== "undefined") {
          const origin = window.location.origin;
          const redirectComplete = resolveReturnUrl(safeReturnUrl) ?? origin;
          const ready = await waitForClerkReady(clerk);
          if (!ready) {
            throw new Error(
              "認証システムの準備中です。数秒おいてもう一度お試しください。",
            );
          }
          if (clerk.user) {
            window.location.href = redirectComplete;
            return;
          }
          window.location.href = buildSignInAutoXHref(
            resolveReturnPath(safeReturnUrl),
          );
          return;
        }

        const redirectUrl = `${getApiBaseUrl()}/oauth/twitter-callback`;
        const result = await startOAuthFlow({ redirectUrl });

        if (result.createdSessionId && result.setActive) {
          await result.setActive({ session: result.createdSessionId });
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
      } catch (err: unknown) {
        console.error("[Auth] OAuth login error:", err);
        const message =
          err instanceof Error ? err.message : "ログイン処理に失敗しました";
        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          const { Alert } = require("react-native");
          Alert.alert("エラー", message);
        }
      }
    },
    [startOAuthFlow, getToken, signOut, clerk],
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

  const user = useMemo(() => {
    if (!clerkIsLoaded) return null;
    return buildUserFromClerk(clerkUser);
  }, [clerkUser, clerkIsLoaded]);

  const isAuthenticated = clerkIsLoaded && !!clerkUser;

  useEffect(() => {
    if (Platform.OS === "web" && isAuthenticated) {
      getToken().then((token) => {
        if (!token) return;
        fetch(`${getApiBaseUrl()}/api/auth/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          console.warn("[Auth] Web backend sync failed:", err);
        });
      });
    }
  }, [isAuthenticated, getToken]);

  const [authReadyTimeout, setAuthReadyTimeout] = useState(false);
  useEffect(() => {
    if (clerkIsLoaded) return;
    const t = setTimeout(() => setAuthReadyTimeout(true), 1000);
    return () => clearTimeout(t);
  }, [clerkIsLoaded]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading: !clerkIsLoaded,
      error: null,
      isAuthenticated,
      isAuthReady: clerkIsLoaded,
      isAuthReadyForUI: clerkIsLoaded || authReadyTimeout,
      refresh: async () => {},
      logout,
      login,
    }),
    [user, clerkIsLoaded, isAuthenticated, authReadyTimeout, logout, login],
  );

  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;
}
