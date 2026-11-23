/**
 * api/nearby-ride.ts
 *
 * チェックインした場所の「この近くの乗りもの・トイレ」を返す。
 * データは姉妹サービス nearby-ride-map（https://nearby-ride-map.vercel.app）の公開APIから取る。
 *
 * ★なぜサーバー経由なのか（api/weather.ts と同じ理由）:
 *   CSP の connect-src に nearby-ride-map のドメインが無い。CSP を緩めず、'self' の /api で中継する。
 *
 * ★失敗はすべて 200 + {ok:false}。補助情報なので、取れなければ画面に出さないだけ。
 * ★位置はここでも中継先でも保存しない（中継先は位置を受け取って近い順に並べるだけ）。
 */
import { pickNearbyRide, NEARBY_RIDE_SITE } from "../lib/nearby-ride/types.js";

export const config = { runtime: "edge" };

const TIMEOUT_MS = 6000;

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 空き台数は1分ごとに変わるので CDN には持たせない
      "Cache-Control": "no-store",
    },
  });
}

async function getJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return json({ ok: false });
    }
    const q = `lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`;
    const [nearby, toilets] = await Promise.all([
      getJson(`${NEARBY_RIDE_SITE}/api/nearby?${q}`),
      getJson(`${NEARBY_RIDE_SITE}/api/toilets?${q}`),
    ]);
    if (!nearby && !toilets) return json({ ok: false });
    return json({ ok: true, result: pickNearbyRide(nearby, toilets) });
  } catch {
    return json({ ok: false });
  }
}
