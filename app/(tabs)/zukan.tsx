/**
 * 図鑑 — 認証ゲート。未ログイン時は地図 chunk / tRPC を読まない。
 */
import { lazy } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TabGuestPreviewScreen } from "@/components/tabs/tab-guest-preview-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";

const ZukanAuthenticatedScreen = lazy(() =>
  import("@/components/zukan/zukan-authenticated-screen").then((m) => ({
    default: m.ZukanAuthenticatedScreen,
  })),
);

export default function ZukanScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
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
    <TabAuthenticatedShell screenName="ZukanTab">
      <ZukanAuthenticatedScreen />
    </TabAuthenticatedShell>
  );
}
