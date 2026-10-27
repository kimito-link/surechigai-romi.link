/**
 * 軌跡マップ — 認証ゲート。未ログイン時は WebTrailMap chunk を読まない。
 */
import { useAuth } from "@/hooks/use-auth";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { TrailGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";
import { GuestPlaceContext } from "@/components/molecules/guest-place-context";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";
import { useReleaseBootWhen } from "@/components/boot/use-release-boot";

export default function MapScreen() {
  const { isAuthenticated, isAuthReady, isAuthReadyForUI } = useAuth();
  const waiting = !isAuthReadyForUI || (isAuthenticated && !isAuthReady);
  useReleaseBootWhen(!waiting && !isAuthenticated);

  if (waiting) {
    return <BrandLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="軌跡"
        headline="移動の軌跡を、地図に刻む"
        preview={<TrailGuestPreview />}
        benefits={[
          { icon: "timeline", label: "軌跡" },
          { icon: "navigation", label: "ここへ向かう" },
          { icon: "place", label: "聖地巡礼" },
        ]}
        heroExtra={<GuestPlaceContext />}
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="MapTab">
      <AuthenticatedScreenSlot screen="map" />
    </TabAuthenticatedShell>
  );
}
