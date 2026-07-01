/**
 * 軌跡マップ — 認証ゲート。未ログイン時は WebTrailMap chunk を読まない。
 */
import { lazy, Suspense } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { TabGuestPreviewScreen } from "@/components/tabs/tab-guest-preview-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { color } from "@/theme/tokens";

const MapAuthenticatedScreen = lazy(() =>
  import("@/components/map/map-authenticated-screen").then((m) => ({
    default: m.MapAuthenticatedScreen,
  })),
);

export default function MapScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={color.accentPrimary} />
      </View>
    );
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
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <MapAuthenticatedScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4F8",
  },
});
