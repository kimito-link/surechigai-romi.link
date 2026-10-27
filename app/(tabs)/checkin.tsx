/**
 * チェックイン画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は reanimated / 地図 chunk を読まない。
 */

import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { CheckinGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";
import { useReleaseBootWhen } from "@/components/boot/use-release-boot";

export default function CheckinScreen() {
  const { isAuthenticated, isAuthReady, isAuthReadyForUI } = useAuth();
  const waiting = !isAuthReadyForUI || !isAuthReady;
  useReleaseBootWhen(!waiting && !isAuthenticated);

  if (waiting) {
    return <BrandLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="現在地"
        headline={"今いる場所を、\nあとで行ける精度で残す"}
        preview={<CheckinGuestPreview />}
        benefits={[
          { icon: "place", label: "正確に残す" },
          { icon: "near-me", label: "すれ違う" },
          { icon: "map", label: "たどれる" },
        ]}
      />
    );
  }

  return (
    <TabAuthenticatedShell screenName="CheckinTab">
      <AuthenticatedScreenSlot screen="checkin" />
    </TabAuthenticatedShell>
  );
}
