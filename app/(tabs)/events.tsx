/**
 * 集まり画面 — 認証ゲート + guest / 認証済み chunk の遅延読み込み。
 */
import { useAuth } from "@/hooks/use-auth";
import { EventsGuestContent } from "@/components/events/events-guest-content";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";
import { AuthenticatedScreenSlot } from "@/components/tabs/authenticated-screen-slot";

export default function EventsScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <BrandLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <EventsGuestContent />;
  }

  return (
    <TabAuthenticatedShell screenName="EventsTab">
      <AuthenticatedScreenSlot screen="events" />
    </TabAuthenticatedShell>
  );
}
