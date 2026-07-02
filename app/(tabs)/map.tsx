/**
 * 軌跡マップ — 認証ゲート。未ログイン時は WebTrailMap chunk を読まない。
 */
import { lazy } from "react";
import { useAuth } from "@/hooks/use-auth";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { TrailGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";

const MapAuthenticatedScreen = lazy(() =>
  import("@/components/map/map-authenticated-screen").then((m) => ({
    default: m.MapAuthenticatedScreen,
  })),
);

export default function MapScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
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
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="MapTab">
      <MapAuthenticatedScreen />
    </TabAuthenticatedShell>
  );
}
