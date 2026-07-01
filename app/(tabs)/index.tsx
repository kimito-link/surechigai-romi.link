/**
 * ポスト画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は radar / tRPC / reanimated chunk を読まない。
 */
import { lazy } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PostGuestScreen } from "@/components/post/post-guest-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";

const PostAuthenticatedScreen = lazy(() =>
  import("@/components/post/post-authenticated-screen").then((m) => ({
    default: m.PostAuthenticatedScreen,
  })),
);

export default function PostScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
  }

  if (!isAuthenticated) {
    return <PostGuestScreen />;
  }

  return (
    <TabAuthenticatedShell screenName="PostTab">
      <PostAuthenticatedScreen />
    </TabAuthenticatedShell>
  );
}
