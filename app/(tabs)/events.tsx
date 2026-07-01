/**
 * 集まり画面 — 認証ゲート + guest / 認証済み chunk の遅延読み込み。
 */
import { lazy } from "react";
import { useAuth } from "@/hooks/use-auth";
import { EventsGuestContent } from "@/components/events/events-guest-content";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { TabAuthenticatedShell } from "@/components/tabs/tab-authenticated-shell";

const EventsAuthenticatedScreen = lazy(() =>
  import("@/components/events/events-authenticated-screen").then((m) => ({
    default: m.EventsAuthenticatedScreen,
  })),
);

export default function EventsScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
  }

  if (!isAuthenticated) {
    return <EventsGuestContent />;
  }

  return (
    <TabAuthenticatedShell screenName="EventsTab">
      <EventsAuthenticatedScreen />
    </TabAuthenticatedShell>
  );
}
