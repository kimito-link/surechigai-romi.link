/**
 * チェックイン画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は reanimated / 地図 chunk を読まない。
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { OneTapGuestShell } from "@/components/organisms/one-tap-guest-shell";
import { CheckinGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";

export default function CheckinScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <TabScreenHeader
          title="チェックイン"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          showLoginButton={!isAuthenticated}
        />
        <BrandLoadingScreen />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <OneTapGuestShell
        title="チェックイン"
        headline="今いる場所を、あとで行ける精度で残す"
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
    <TabAuthenticatedShell screenName="CheckinTab" fallbackMinHeight={480}>
      <AuthenticatedScreenSlot screen="checkin" />
    </TabAuthenticatedShell>
  );
}
