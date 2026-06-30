import { lazy, Suspense } from "react";
import { ChunkFallback } from "@/lib/chunk-fallback";

const EventsGuestContent = lazy(() =>
  import("@/components/events/events-guest-content").then((m) => ({
    default: m.EventsGuestContent,
  })),
);

/** 未ログイン向け — HostPanel / PrefectureSelector chunk を含まない。 */
export function EventsGuestScreen() {
  return (
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <EventsGuestContent />
    </Suspense>
  );
}
