/**
 * api/live-stream.ts
 *
 * 足あとの場所の「いま配信中のライブ映像」を1本返す。
 *
 * ★なぜ必要か（2026-08-21 ユーザー指摘）:
 *   従来は YouTube の**検索結果ページ**へ飛ばしていた。押しても一覧が出るだけで、
 *   利用者が自分で選ぶ必要がある。さらに「ライブカメラ」ボタンは国交省の
 *   一覧ページ（ダムの図など）に飛び、映像まで数ステップかかっていた。
 *   ここでは「配信中のものだけ」を絞って先頭を返し、押した瞬間に映像へ繋ぐ。
 *
 * ★なぜサーバー経由なのか:
 *   API キーをクライアントに出さないため。`EXPO_PUBLIC_` を付けない名前に
 *   することでバンドルにも埋め込まれない（Metro は EXPO_PUBLIC_* しか置換しない）。
 *   加えて CSP の connect-src に googleapis.com が無く、ブラウザから直接は叩けない。
 *   CSP を緩めるより 'self' で許可済みの /api 配下で中継する方が安全
 *   （セキュリティ境界を外部事業者の都合で広げない。api/weather.ts と同じ判断）。
 *
 * ★無料枠の守り方:
 *   YouTube Data API は 1日 10,000 ユニット / search は 1回 100 ユニット
 *   ＝ 1日100回まで。市区町村ごとに CDN キャッシュ（6時間）を効かせるので、
 *   同じ場所からの連打は 1回に集約される。上限に達した日は quota エラーになるが、
 *   その場合も従来の検索リンクに落ちるだけで壊れない。
 *
 * ★キーが無くても壊さない:
 *   未設定・失敗・該当なしは全て 200 + {ok:false} で返す。呼び出し側は
 *   従来どおり検索結果ページへ落とす（fail-safe。導線が消えるより良い）。
 *   404/500 を返さないのは、クライアント側の分岐を1つに保つため。
 */
import {
  pickLiveStream,
  placeCore,
  type LiveCandidate,
  type PickedLiveStream,
} from "../lib/live-camera/live-stream-pick.js";

export const config = { runtime: "edge" };

/**
 * CDN に持たせる時間。ライブ配信は数時間〜常時なので6時間で十分新しく、
 * かつ YouTube への問い合わせは「地名の数 × 6時間に1回」が上限になる。
 */
const CACHE_CONTROL = "public, s-maxage=21600, stale-while-revalidate=43200";

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

/**
 * 地名から「配信中のライブカメラ」の候補を取る。
 *
 * eventType=live で**配信中のみ**に絞る。これがないと終了した配信を掴み、
 * 押しても映像が出ない（検索結果ページ方式で実際に起きていた問題）。
 *
 * maxResults=5 なのは、1位が無関係でも 2〜5位に当たりがあることが多いため。
 * search のコストは件数によらず 100 ユニット固定なので、増やしても消費は同じ。
 */
async function searchCandidates(
  place: string,
  apiKey: string,
): Promise<LiveCandidate[]> {
  const params = new URLSearchParams({
    part: "snippet",
    // 接尾辞を落とした核で引く（「茅野市」より「茅野」の方が配信名に一致する）
    q: `${placeCore(place)} ライブカメラ`,
    type: "video",
    eventType: "live",
    maxResults: "5",
    regionCode: "JP",
    relevanceLanguage: "ja",
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: {
      id?: { videoId?: string };
      snippet?: { title?: string; channelTitle?: string };
    }[];
  };

  return (data.items ?? []).map((item) => ({
    videoId: item.id?.videoId ?? "",
    title: item.snippet?.title ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
  }));
}

/** 1つの地名で探して、地名が確認できる1本を選ぶ */
async function findFor(
  place: string,
  apiKey: string,
): Promise<PickedLiveStream | null> {
  const candidates = await searchCandidates(place, apiKey);
  return pickLiveStream(candidates, place);
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const municipality = (url.searchParams.get("municipality") ?? "").trim().slice(0, 40);
  const prefecture = (url.searchParams.get("pref") ?? "").trim().slice(0, 40);

  if (!municipality && !prefecture) {
    return json({ ok: false, reason: "no-place" }, false);
  }

  // クライアントに出さない名前にする（EXPO_PUBLIC_ を付けない）
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // キー未設定でも壊さない。呼び出し側は検索結果ページへ落とす。
    return json({ ok: false, reason: "no-key" }, false);
  }

  try {
    /* まず市区町村で探す（近い映像ほど価値がある）。
       小さな市では配信が無いことも多いので、その場合だけ都道府県で引き直す。
       2回叩くと消費は倍だが、6時間キャッシュがあるので実質の上限は
       「1日100地点」のまま。近い映像が出る価値の方が大きい。 */
    let stream = municipality ? await findFor(municipality, apiKey) : null;
    let matched = municipality;

    if (!stream && prefecture && prefecture !== municipality) {
      stream = await findFor(prefecture, apiKey);
      matched = prefecture;
    }

    if (!stream) {
      // 「その地名で配信中のものが無い」は正常な結果。キャッシュしてよい
      // （無い状態は数時間変わらないので、毎回問い合わせる必要がない）。
      return json({ ok: false, reason: "not-found" }, true);
    }

    return json({ ok: true, stream, matchedPlace: matched }, true);
  } catch {
    // タイムアウト・ネットワーク断。次の訪問では取れるかもしれないのでキャッシュしない
    return json({ ok: false, reason: "error" }, false);
  }
}
