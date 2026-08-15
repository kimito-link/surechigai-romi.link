/**
 * api/weather.ts
 *
 * 足あとの場所の「きょうの天気」を返す。
 *
 * ★なぜサーバー経由なのか:
 *   CSP の connect-src に気象庁ドメインが無く（vercel.json）、ブラウザから直接
 *   叩くと遮断される。CSP を緩めるより、既に 'self' で許可されている /api 配下で
 *   中継する方が安全（セキュリティ境界を外部サイトの都合で広げない）。
 *
 * ★データ源は非公式・無保証。よって失敗はすべて 200 + {ok:false} で返す。
 *   404/500 を返さないのは、クライアント側の分岐を1つに保つため
 *   （天気は補助情報であり、取れなければ行を出さないだけ）。
 *
 * ★未解決 Promise を残さないこと。Vercel Functions は未解決 Promise があると
 *   その完了まで応答が詰まる（OGPウォームで実際に障害を起こした型）。
 */
import { jmaOfficeCodeFor } from "../lib/weather/jma-area-codes.js";
import { fetchPrefWeather } from "../lib/weather/jma-forecast.js";

export const config = { runtime: "edge" };

/**
 * CDN に持たせる時間。気象庁の更新は1日数回なので30分で十分新しく、
 * かつ気象庁への負荷は「予報区数 × 30分に1回」が上限になる。
 */
const CACHE_CONTROL = "public, s-maxage=1800, stale-while-revalidate=3600";

function json(body: unknown, cache: boolean): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 失敗はキャッシュしない（次のリクエストで回復させる）
      "Cache-Control": cache ? CACHE_CONTROL : "no-store",
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const prefecture = url.searchParams.get("pref");
    const municipality = url.searchParams.get("municipality");

    const office = jmaOfficeCodeFor(prefecture, municipality);
    if (!office) return json({ ok: false }, false);

    const weather = await fetchPrefWeather(office);
    if (!weather) return json({ ok: false }, false);

    return json({ ok: true, weather }, true);
  } catch {
    return json({ ok: false }, false);
  }
}
