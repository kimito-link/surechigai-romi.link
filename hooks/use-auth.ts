import * as Auth from "@/lib/_core/auth";
import { USER_INFO_KEY } from "@/constants/oauth";
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
function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstNumber(...values: any[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    name:
      clerkUser.fullName ||
      username ||
      storedUser?.name ||
      null,
    email: clerkUser.primaryEmailAddress?.emailAddress || null,
    loginMethod: "twitter",
    lastSignedIn: new Date(),
    username,
    profileImage,
    followersCount,
    twitterId,
  };
}

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkIsLoaded } = useUser();
  const isLoaded = clerkIsLoaded;
  const { signOut, getToken } = useClerkAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_x" });

  const login = useCallback(
    async (returnUrl?: string, forceSwitch = false) => {
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

        if (forceSwitch) {
          try {
            await signOut();
            await Auth.removeSessionToken();
            await Auth.clearUserInfo();
            await clearAllTokenData();
          } catch (signOutErr) {
            console.warn("[Auth] signOut before account switch failed:", signOutErr);
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
          // Web は既定でサテライト(方式A)。明示的に "false" のときだけ単独インスタンス扱い。
          const isSatellite = process.env.EXPO_PUBLIC_CLERK_IS_SATELLITE !== "false";
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
            // X 認証後に Clerk が一旦受ける先
            redirectUrl: `${origin}/sso-callback`,
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
    [startOAuthFlow, getToken, signOut],
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

  const isAuthenticated = useMemo(() => {
    return clerkIsLoaded && !!clerkUser;
  }, [clerkUser, clerkIsLoaded]);

  // Web 環境で Clerk の認証が完了（isAuthenticated = true）した場合、
  // バックエンドにユーザーを同期するための自動処理
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
