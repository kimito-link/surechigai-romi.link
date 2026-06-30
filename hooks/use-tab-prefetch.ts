import { useCallback } from "react";
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

export function usePrefetchTab() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  return useCallback(
    (tab: TabPrefetchKey) => {
      if (!isAuthenticated) return;
      prefetchTabData(utils, tab);
    },
    [isAuthenticated, utils],
  );
}
