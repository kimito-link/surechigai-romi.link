/**
 * プリフェッチフック
 * タブ切り替え前に次の画面のデータを事前読み込み
 * v5.34: 初期表示高速化のために追加
 */
import { useEffect, useCallback, useMemo, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useNetworkStatus } from "@/hooks/use-offline-cache";

const PREFETCH_DELAY_MS = 1000;

function prefersReducedData(): boolean {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection?.saveData) return true;
    const effectiveType = connection?.effectiveType;
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      return true;
    }
  }
  return false;
}

/**
 * ホーム画面のデータをプリフェッチ
 */
export function usePrefetchHome() {
  const utils = trpc.useUtils();
  
  const prefetch = useCallback(async () => {
    try {
      // チャレンジ一覧をプリフェッチ
      await utils.events.listPaginated.prefetchInfinite(
        { limit: 20, filter: "all" },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          initialCursor: 0,
        }
      );
      // カテゴリ一覧をプリフェッチ
      await utils.categories.list.prefetch();
    } catch (error) {
      // プリフェッチエラーは無視（バックグラウンド処理）
      console.debug("[Prefetch] Home prefetch failed:", error);
    }
  }, [utils]);
  
  return { prefetch };
}

/**
 * マイページのデータをプリフェッチ
 */
export function usePrefetchMypage() {
  const utils = trpc.useUtils();
  
  const prefetch = useCallback(async () => {
    try {
      // ユーザーの参加チャレンジをプリフェッチ
      await utils.participations.myParticipations.prefetch();
      // ユーザーの作成チャレンジをプリフェッチ
      await utils.events.myEvents.prefetch();
    } catch (error) {
      console.debug("[Prefetch] Mypage prefetch failed:", error);
    }
  }, [utils]);
  
  return { prefetch };
}

/**
 * チャレンジ作成画面のデータをプリフェッチ
 */
export function usePrefetchCreate() {
  const utils = trpc.useUtils();
  
  const prefetch = useCallback(async () => {
    try {
      // カテゴリ一覧をプリフェッチ
      await utils.categories.list.prefetch();
      // テンプレート一覧をプリフェッチ
      await utils.templates.list.prefetch();
    } catch (error) {
      console.debug("[Prefetch] Create prefetch failed:", error);
    }
  }, [utils]);
  
  return { prefetch };
}

/**
 * プロフィール画面のデータをプリフェッチ
 */
export function usePrefetchProfile(userId: number) {
  const utils = trpc.useUtils();

  const prefetch = useCallback(async () => {
    try {
      await Promise.all([
        utils.profiles.get.prefetch({ userId }),
        utils.follows.followerCount.prefetch({ userId }),
        utils.follows.followingCount.prefetch({ userId }),
      ]);
    } catch (error) {
      console.debug("[Prefetch] Profile prefetch failed:", error);
    }
  }, [utils, userId]);

  return { prefetch };
}

/**
 * タブ切り替え時のプリフェッチを自動実行
 * 現在のタブに応じて、他のタブのデータを事前読み込み
 */
export function useTabPrefetch(currentTab: "home" | "create" | "mypage") {
  const { prefetch: prefetchHome } = usePrefetchHome();
  const { prefetch: prefetchMypage } = usePrefetchMypage();
  const { prefetch: prefetchCreate } = usePrefetchCreate();
  const { isOffline } = useNetworkStatus();
  const dataSaverEnabled = useMemo(prefersReducedData, []);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");

  useEffect(() => {
    const handleStateChange = (nextState: AppStateStatus) => {
      setIsAppActive(nextState === "active");
    };

    const subscription = AppState.addEventListener("change", handleStateChange);
    return () => {
      if (typeof subscription?.remove === "function") {
        subscription.remove();
      } else {
        const _as = AppState as unknown as { removeEventListener?: (event: string, handler: (state: AppStateStatus) => void) => void };
        if (typeof _as.removeEventListener === "function") {
          _as.removeEventListener("change", handleStateChange);
        }
      }
    };
  }, []);
  
  useEffect(() => {
    if (isOffline || !isAppActive || dataSaverEnabled) {
      return;
    }

    // 現在のタブ以外のデータをプリフェッチ（遅延実行）
    const timer = setTimeout(() => {
      switch (currentTab) {
        case "home":
          // ホームにいる時は、マイページと作成画面をプリフェッチ
          prefetchMypage();
          prefetchCreate();
          break;
        case "create":
          // 作成画面にいる時は、ホームとマイページをプリフェッチ
          prefetchHome();
          prefetchMypage();
          break;
        case "mypage":
          // マイページにいる時は、ホームと作成画面をプリフェッチ
          prefetchHome();
          prefetchCreate();
          break;
      }
    }, PREFETCH_DELAY_MS); // 初期描画後にゆるやかにプリフェッチ
  
    return () => clearTimeout(timer);
  }, [currentTab, dataSaverEnabled, isAppActive, isOffline, prefetchHome, prefetchMypage, prefetchCreate]);
}
