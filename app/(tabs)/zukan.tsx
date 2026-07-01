/**
 * 図鑑 — 認証ゲート。未ログイン時は地図 chunk / tRPC を読まない。
 */
import { lazy, Suspense } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { TabGuestPreviewScreen } from "@/components/tabs/tab-guest-preview-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { color } from "@/theme/tokens";

const ZukanAuthenticatedScreen = lazy(() =>
  import("@/components/zukan/zukan-authenticated-screen").then((m) => ({
    default: m.ZukanAuthenticatedScreen,
  })),
);

export default function ZukanScreen() {
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
        title="みんなの現在地"
        headline="会いたい君がいる都道府県が、地図ですぐわかる"
        benefits={[
          { icon: "public", label: "公開中のクリエイターがどこにいるか一覧" },
          { icon: "map", label: "訪れた都道府県・市区町村が色づく" },
          { icon: "place", label: "足あとの正確な場所をあとからたどれる" },
        ]}
      />
    );
  }

  return (
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <ZukanAuthenticatedScreen />
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
