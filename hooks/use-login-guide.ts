import { usePathname } from "expo-router";
import { useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useAuthHandoff } from "@/lib/auth-handoff-context";
import { buildSignInHref } from "@/lib/clerk-route";

export type LoginGuideMode = "same" | "switch";

type LoginGuideOptions = {
  returnTo?: string;
  mode?: LoginGuideMode;
};

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * ログイン誘導フック。
 * kimito.link と同じく「タップ即 X 認証（Clerk サインイン）」へ進む。
 * 以前あった独自の確認画面 /auth/kimito-link は省略し、login() を直接呼ぶ。
 */
export function useLoginGuide() {
  const pathname = usePathname();
  const { login } = useAuth();
  const { showHandoff } = useAuthHandoff();

  return useCallback(
    (options: LoginGuideOptions = {}) => {
      const returnTo = options.returnTo ?? normalizeReturnTo(pathname);
      const isSwitch = options.mode === "switch";
      showHandoff("x");
      if (Platform.OS === "web" && typeof window !== "undefined" && !isSwitch) {
        window.location.href = buildSignInHref(returnTo);
        return;
      }
      void login(returnTo, isSwitch);
    },
    [pathname, login, showHandoff],
  );
}
