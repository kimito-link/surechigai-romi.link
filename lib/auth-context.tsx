import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { buildSignInAutoXHref } from "@/lib/clerk-route";
import type { User as AuthUserType } from "@/lib/_core/auth";

export type AuthUser = AuthUserType;

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isAuthReadyForUI: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  login: (returnUrl?: string, forceSwitch?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthContextProvider({
  value,
  children,
}: {
  value: AuthState;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function resolveGuestReturnUrl(returnUrl?: string): string {
  if (typeof returnUrl !== "string" || !returnUrl) return "/";
  const normalized = returnUrl.startsWith("/(tabs)/")
    ? returnUrl.replace("/(tabs)/", "/")
    : returnUrl;
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

/** Clerk 非ロード guest ルート用（Web トップ `/` 等）。login は /sign-in へ直行。 */
export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const login = useCallback(async (returnUrl?: string) => {
    const safeReturnUrl = typeof returnUrl === "string" ? returnUrl : undefined;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = buildSignInAutoXHref(
        resolveGuestReturnUrl(safeReturnUrl),
      );
      return;
    }
    throw new Error("Guest login is only supported on web");
  }, []);

  const logout = useCallback(async () => {
    const Auth = await import("@/lib/_core/auth");
    await Auth.removeSessionToken();
    await Auth.clearUserInfo();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isAuthReady: true,
      isAuthReadyForUI: true,
      refresh: async () => {},
      logout,
      login,
    }),
    [login, logout],
  );

  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;
}
