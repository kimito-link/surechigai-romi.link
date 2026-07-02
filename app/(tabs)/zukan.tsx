/**
 * 図鑑 — 認証ゲート。未ログイン時は地図 chunk / tRPC を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { ZukanGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";

export default function ZukanScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="現在地"
        headline="会いたい君がいる都道府県"
        preview={<ZukanGuestPreview />}
        benefits={[
          { icon: "map", label: "都道府県" },
          { icon: "groups", label: "みんな" },
          { icon: "ios-share", label: "Xでシェア" },
        ]}
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="ZukanTab">
      <AuthenticatedScreenSlot screen="zukan" />
    </TabAuthenticatedShell>
  );
}
