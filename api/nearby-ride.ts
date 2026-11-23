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
import { pickNearbyRide, roundForNearby, NEARBY_RIDE_SITE } from "../lib/nearby-ride/types.js";

export const config = { runtime: "edge" };

const TIMEOUT_MS = 6000;

/**
 * 空き台数の更新は約1分ごと。座標を約100mに丸めているので、同じ場所の問い合わせは CDN で1分まとめる。
 * 失敗はキャッシュしない（次で回復させる）。
 */
const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=60";

function json(body: unknown, cache = false): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache ? CACHE_CONTROL : "no-store",
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
    const q = `lat=${roundForNearby(lat)}&lon=${roundForNearby(lng)}`;
    const [nearby, toilets] = await Promise.all([
      getJson(`${NEARBY_RIDE_SITE}/api/nearby?${q}`),
      getJson(`${NEARBY_RIDE_SITE}/api/toilets?${q}`),
    ]);
    if (!nearby && !toilets) return json({ ok: false });
    return json({ ok: true, result: pickNearbyRide(nearby, toilets) }, true);
  } catch {
    return json({ ok: false });
  }
}
