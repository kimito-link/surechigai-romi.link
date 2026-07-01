import { createContext, createElement, useCallback, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import {
  prefetchTabData,
  type TabPrefetchKey,
} from "@/lib/bootstrap/prefetch-tab-data";

const HREF_TAB_MAP: Record<string, TabPrefetchKey> = {
  "/": "post",
  "/index": "post",
  "/checkin": "checkin",
  "/events": "events",
  "/zukan": "zukan",
  "/map": "map",
  "/mypage": "mypage",
};

const noopPrefetch = (_tab: TabPrefetchKey) => {};

const TabPrefetchContext = createContext<(tab: TabPrefetchKey) => void>(noopPrefetch);

/** expo-router / React Navigation の href から prefetch 対象タブを解決 */
export function hrefToTabPrefetchKey(href: string | undefined): TabPrefetchKey | null {
  if (!href) return null;
  const normalized = href.replace(/^\(\/?tabs\)/, "").replace(/^\//, "/") || "/";
  for (const [prefix, tab] of Object.entries(HREF_TAB_MAP)) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return tab;
    }
  }
  if (href.includes("checkin")) return "checkin";
  if (href.includes("events")) return "events";
  if (href.includes("zukan")) return "zukan";
  if (href.includes("map")) return "map";
  if (href.includes("mypage")) return "mypage";
  return "post";
}

/**
 * tRPC Provider 配下でのみ prefetch を有効化。
 * Guest `/` 初回 paint（tRPC defer）では no-op のまま — trpc.useUtils() を呼ばない。
 */
export function TabPrefetchProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const prefetch = useCallback(
    (tab: TabPrefetchKey) => {
      if (!isAuthenticated) return;
      prefetchTabData(utils, tab);
    },
    [isAuthenticated, utils],
  );

  return createElement(TabPrefetchContext.Provider, { value: prefetch }, children);
}

export function usePrefetchTab() {
  return useContext(TabPrefetchContext);
}
