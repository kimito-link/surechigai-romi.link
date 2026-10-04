/**
 * ポスト画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は radar / tRPC / reanimated chunk を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { PostGuestScreen } from "@/components/post/post-guest-screen";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";
import { hasClerkSessionHint } from "@/lib/clerk-public-routes";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";

export default function PostScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    // ログイン済みヒントがあるのにゲスト用ヒーローを一瞬見せると
    // リロードのたびに画面がゲスト→認証UIへ切り替わってちらつく。
    // ヒントがある間は待機画面で待つ（ゲストには従来どおりヒーロー即表示）。
    // ★2026-10-05: 灰色の骨組み（ChunkFallback）をやめ、起動ベール(#romi-boot-veil)と同じ
    //   ブランドの待機画面に寄せた。iPhoneのホーム画面から開く(PWA)と、
    //   ベール → 無地 → 灰色の骨組み → 本編 と色の違う画面が1秒弱の間に4つ続き、
    //   「ちかちか」に見えた（実機の画面録画を120fpsで解析して確認）。
    //   BrandLoadingScreen は「ベール解除後に繋がっても絵が飛ばない」ように
    //   背景色・ロゴ・配置を揃えてある部品で、読み込み画面は全部これに寄せる、が元々の設計。
    if (hasClerkSessionHint()) {
      return <BrandLoadingScreen />;
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
