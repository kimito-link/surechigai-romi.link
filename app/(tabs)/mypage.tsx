/**
 * マイページ — 認証ゲート。未ログイン時は tRPC / 設定 chunk を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { MypageGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";

export default function MypageScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="マイページ"
        headline="あなたの足あとと公開範囲を、ここで"
        preview={<MypageGuestPreview />}
        benefits={[
          { icon: "person", label: "プロフィール" },
          { icon: "visibility", label: "公開範囲" },
          { icon: "pause", label: "一時停止" },
        ]}
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="MypageTab">
      <AuthenticatedScreenSlot screen="mypage" />
    </TabAuthenticatedShell>
  );
}
