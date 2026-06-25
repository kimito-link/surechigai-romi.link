import { router, usePathname } from "expo-router";
import { useCallback } from "react";

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

export function useLoginGuide() {
  const pathname = usePathname();

  return useCallback(
    (options: LoginGuideOptions = {}) => {
      const returnTo = options.returnTo ?? normalizeReturnTo(pathname);
      const params: Record<string, string> = { returnTo };
      if (options.mode) params.mode = options.mode;

      router.push({
        pathname: "/auth/kimito-link",
        params,
      } as never);
    },
    [pathname],
  );
}
