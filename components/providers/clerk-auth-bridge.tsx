/**
 * Clerk hooks → AuthContext（clerk-root-provider chunk 内でのみ import される）。
 */
import * as Auth from "@/lib/_core/auth";
import { USER_INFO_KEY } from "@/constants/oauth";
import { getApiBaseUrl } from "@/lib/api/config";
import { clearAllTokenData } from "@/lib/token-manager";
import { buildSignInAutoXHref, buildSignInSwitchHref } from "@/lib/clerk-route";
import { stripTabsGroupPrefix } from "@/lib/navigation/normalize-return-url";
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
  const normalized = stripTabsGroupPrefix(returnUrl);
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

  const normalized = stripTabsGroupPrefix(returnUrl);
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

/**
 * login() が Web で飛ばす sign-in URL を決める。
 *
 * 通常ログインは `auto=x`（1タップ導線）、**アカウント切り替えのときは付けない**。
 * `auto=x` が付いていると AutoAdvanceToX が X ボタンを自動クリックし、X 側の
 * ブラウザセッションが生きていれば認可画面が素通りして**同じアカウントで即座に戻る**。
 * 切り替えたい人にとっては介入する猶予すら無くなるので有害（＝症状の増幅器）。
 *
 * 純関数として export しているのはテストのため（resolveReturnUrl / resolveReturnPath と同じ流儀）。
 */
export function resolveSignInHrefForLogin(
  returnPath: string,
  forceSwitch: boolean,
): string {
  return forceSwitch
    ? buildSignInSwitchHref(returnPath)
    : buildSignInAutoXHref(returnPath);
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
  // X 連携だけを探す。`?? externalAccounts[0]` で1つ目に falls back すると、
  // Sign in with Apple を主導線にした(2026-08-05)以降に現実に存在する
  // 「Apple/Google だけのユーザー」の Apple アカウントを X として掴んでしまい、
  // Apple の非公開リレー名が @ハンドルとして画面に出る。他プロバイダには倒さない。
  // 壊れた連携(verification が verified 以外)も採用しない。
  const externalAccount = clerkUser.externalAccounts?.find?.((account: any) => {
    const p = String(account?.provider ?? "").toLowerCase();
    const isX =
      p === "x" ||
      p === "twitter" ||
      p === "oauth_x" ||
      p === "oauth_twitter" ||
      p.endsWith("_x") ||
      p.endsWith("_twitter");
    if (!isX) return false;
    const status = account?.verification?.status;
    return !status || status === "verified";
  });
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
  // Guideline 4.8 対応。Clerk 側で oauth_apple は有効化済み（2026-07-31 確認）。
  // useOAuth は既に import 済みなのでモジュールの依存関係は増えない。
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: "oauth_apple" });
  const clerk = useClerk();

  const login = useCallback(
    async (returnUrl?: string, forceSwitch = false, provider: "x" | "apple" = "x") => {
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
          // forceSwitch のときはこのガードを通さない。
          // 直前の signOut() 後に clerk.user の null 化が遅れることがあり、掛かると
          // 「別のアカウントに切り替える」を押したのに**元の画面へ戻るだけ**になる。
          // 切り替え時は必ず sign-in まで進める（未ログイン前提の画面なので fail-open で安全）。
          if (!forceSwitch && clerk.user) {
            window.location.href = redirectComplete;
            return;
          }
          window.location.href = resolveSignInHrefForLogin(
            resolveReturnPath(safeReturnUrl),
            forceSwitch,
          );
          return;
        }

        const redirectUrl = `${getApiBaseUrl()}/oauth/twitter-callback`;
        const runOAuth = provider === "apple" ? startAppleOAuthFlow : startOAuthFlow;
        const result = await runOAuth({ redirectUrl });

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
    [startOAuthFlow, startAppleOAuthFlow, getToken, signOut, clerk],
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
