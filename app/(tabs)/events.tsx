/**
 * 集まり画面 — 認証ゲート + guest / 認証済み chunk の遅延読み込み。
 */
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { EventsGuestScreen } from "@/components/events/events-guest-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";

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
    return <EventsGuestScreen />;
  }

  return (
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <EventsAuthenticatedScreen />
    </Suspense>
  );
}
