/**
 * 軌跡マップ — 認証ゲート。未ログイン時は WebTrailMap chunk を読まない。
 */
import { lazy } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TabGuestPreviewScreen } from "@/components/tabs/tab-guest-preview-screen";
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
      <TabGuestPreviewScreen
        title="軌跡"
        headline="ログインすると、あなたの足あとが地図に刻まれます"
        benefits={[
          { icon: "near-me", label: "道路や建物まで辿れる精度で記録" },
          { icon: "navigation", label: "「ここへ向かう」で地図アプリのナビを開始" },
          { icon: "timeline", label: "移動の軌跡をあとから振り返れる" },
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
