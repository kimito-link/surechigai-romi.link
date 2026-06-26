import { usePathname } from "expo-router";
import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

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

  return useCallback(
    (options: LoginGuideOptions = {}) => {
      const returnTo = options.returnTo ?? normalizeReturnTo(pathname);
      const isSwitch = options.mode === "switch";
      void login(returnTo, isSwitch);
    },
    [pathname, login],
  );
}
