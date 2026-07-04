/**
 * ポスト画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は radar / tRPC / reanimated chunk を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { PostGuestScreen } from "@/components/post/post-guest-screen";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";
import { hasClerkSessionHint } from "@/lib/clerk-public-routes";
import { ChunkFallback } from "@/lib/chunk-fallback";

export default function PostScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    // ログイン済みヒントがあるのにゲスト用ヒーローを一瞬見せると
    // リロードのたびに画面がゲスト→認証UIへ切り替わってちらつく。
    // ヒントがある間は中立のスケルトンで待つ（ゲストには従来どおりヒーロー即表示）。
    if (hasClerkSessionHint()) {
      return <ChunkFallback minHeight={360} />;
    }
    return <PostGuestScreen />;
  }

  if (!isAuthenticated) {
    return <PostGuestScreen />;
  }

  return (
    <TabAuthenticatedShell screenName="PostTab">
      <AuthenticatedScreenSlot screen="post" />
    </TabAuthenticatedShell>
  );
}
