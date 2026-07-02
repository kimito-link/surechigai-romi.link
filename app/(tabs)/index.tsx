/**
 * ポスト画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は radar / tRPC / reanimated chunk を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { PostGuestScreen } from "@/components/post/post-guest-screen";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";

export default function PostScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
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
