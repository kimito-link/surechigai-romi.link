/**
 * 図鑑 — 認証ゲート。未ログイン時は地図 chunk / tRPC を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { ZukanGuestLive } from "@/components/organisms/zukan-guest-live";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";

/** 地図ペイン優先のためzukanのみ右パネルを狭める(実測: 見出し・ベネフィット・CTAが
 * 収まる最小幅として280pxを採用。詳細はdocs/zukan-map-larger-DESIGN.md参照)。 */
const ZUKAN_HERO_PANEL_WIDTH = 280;

export default function ZukanScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="現在地"
        headline="会いたい君がいる現在地"
        preview={(heroMapWidth) => <ZukanGuestLive availableWidth={heroMapWidth} />}
        benefits={[
          { icon: "map", label: "都道府県" },
          { icon: "groups", label: "みんな" },
          { icon: "ios-share", label: "Xでシェア" },
        ]}
        heroPanelWidth={ZUKAN_HERO_PANEL_WIDTH}
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="ZukanTab">
      <AuthenticatedScreenSlot screen="zukan" />
    </TabAuthenticatedShell>
  );
}
