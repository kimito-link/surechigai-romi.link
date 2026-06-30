/**
 * Clerk ログイン状態が確定したタイミングで、ユーザー固有の tRPC キャッシュを再取得する。
 * PC ブラウザで React Query persist が空データを復元し続ける問題の対策。
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export function AuthQuerySync() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const utils = trpc.useUtils();
  const prevAuthenticated = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    const becameAuthenticated =
      isAuthenticated && prevAuthenticated.current !== true;

    if (becameAuthenticated) {
      void utils.zukan.invalidate();
      void utils.encounter.invalidate();
      void utils.settings.invalidate();
    }

    prevAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isAuthReady, utils]);

  return null;
}
