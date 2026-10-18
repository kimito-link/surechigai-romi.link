/**
 * 図鑑 — 認証ゲート。未ログイン時は地図 chunk / tRPC を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { ZukanGuestLive } from "@/components/organisms/zukan-guest-live";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";
import { GuestPlaceContext } from "@/components/molecules/guest-place-context";

/** 地図ペイン優先のためzukanのみ右パネルを狭める(実測: 見出し・ベネフィット・CTAが
 * 収まる最小幅として280pxを採用。詳細はdocs/zukan-map-larger-DESIGN.md参照)。 */
const ZUKAN_HERO_PANEL_WIDTH = 280;

export default function ZukanScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <BrandLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="さがす"
        headline="現在地でつながる、すれ違ひ通信"
        preview={(heroMapWidth, layout) => (
          <ZukanGuestLive availableWidth={heroMapWidth} stacked={layout.stacked} />
        )}
        benefits={[
          { icon: "map", label: "都道府県" },
          { icon: "sell", label: "属性で合う" },
          { icon: "ios-share", label: "Xでつながる" },
        ]}
        heroPanelWidth={ZUKAN_HERO_PANEL_WIDTH}
        heroExtra={<GuestPlaceContext />}
        /* 日本地図が主役の画面なので、地図を最初の画面に出し、天気・ライブカメラは地図の下に置く（運営者の判断 2026-10-18） */
        heroExtraPlacement="below"
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="ZukanTab">
      <AuthenticatedScreenSlot screen="zukan" />
    </TabAuthenticatedShell>
  );
}
