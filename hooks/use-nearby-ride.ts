/**
 * hooks/use-nearby-ride.ts
 *
 * チェックインした場所の「この近くの乗りもの・トイレ」を取る（/api/nearby-ride 経由）。
 * ★取れなければ何も出さない（fail-silent）。use-pref-weather と同じ考え方。
 */
import { useEffect, useState } from "react";
import { roundForNearby, type NearbyRideResult } from "@/lib/nearby-ride/types";

export function useNearbyRide(
  lat: number | null | undefined,
  lng: number | null | undefined,
): NearbyRideResult | null {
  const [result, setResult] = useState<NearbyRideResult | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) {
      setResult(null);
      return;
    }
    let alive = true;
    const params = new URLSearchParams({ lat: roundForNearby(lat), lng: roundForNearby(lng) });
    void (async () => {
      try {
        const res = await fetch(`/api/nearby-ride?${params.toString()}`);
        const data = (await res.json()) as { ok: true; result: NearbyRideResult } | { ok: false };
        if (alive) setResult(data.ok ? data.result : null);
      } catch {
        if (alive) setResult(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lat, lng]);

  return result;
}
