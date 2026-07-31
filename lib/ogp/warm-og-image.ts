/**
 * lib/ogp/warm-og-image.ts
 *
 * OGP画像のキャッシュ事前ウォーム。
 *
 * 背景（2026-07-30 実測 / 本番 surechigai.kimito.link）:
 * - /api/og の生成はキャッシュミス時 5.0〜8.3 秒。連続で叩いても毎回 5.8 秒前後なので
 *   コールドスタートではなく satori→PNG のラスタライズ自体が重い（並列4本だと 10.9 秒まで悪化）。
 * - 外部取得は主因ではない（Google Fonts CSS 0.12 秒 / japan.svg 0.09 秒）。
 *   描画内容を変えても 5.0〜5.6 秒とほぼ一定。
 * - キャッシュヒット時は 0.17 秒。
 * - X のクローラーは ~2 秒で諦めるため、キャッシュが冷たいと画像なしカードになる。
 * - シェアURLには v=<記録時刻> が付くので、新しいチェックインほど必ずキャッシュミスになる。
 *   ＝「出るときと出ないときがある」の正体。
 *
 * 対策: チェックイン時とシェアリンク発行時に裏から一度叩いてキャッシュを温める。
 * クローラーが来る頃には 0.17 秒で返る。
 *
 * 失敗しても握り潰す（シェア導線もチェックインも絶対に止めない）。
 */
import { buildOgRedirectImageTarget, type ShareLocationInfo } from "./share-meta.js";

const APP_ORIGIN = "https://surechigai.kimito.link";

/**
 * ウォームは投機的処理なので短く切り上げる。
 *
 * ここを長くしてはいけない（2026-07-31 実機で障害）。Vercel の Serverless は
 * 未解決の Promise が残っていると関数を終了させないため、投げっぱなしにしたつもりでも
 * 呼び出し元のレスポンスがこの時間だけ遅延しうる。当初 15 秒にしていたところ、
 * チェックインとシェアの応答が詰まり、シェアでは about:blank の空タブを
 * ユーザーが見続ける状態になった。
 *
 * 画像生成は 5〜6 秒かかるのでこの時間内には終わらないが、ウォームは
 * 「途中まで進めておく」だけでも次回以降のキャッシュに効くため短くてよい。
 */
const WARM_TIMEOUT_MS = 2_500;

/**
 * OGP画像URLを事前に取得してエッジキャッシュを温める。
 * best-effort。失敗してもクローラー側で生成されるだけなので握り潰す。
 */
export async function warmOgImage(imageUrl: string): Promise<void> {
  try {
    await fetch(imageUrl, {
      // クローラーと同じ表現を取りに行く（別バリアントを温めても意味がない）
      headers: {
        Accept: "image/png,image/*",
        "User-Agent": "surechigai-og-warmer/1.0 (+https://surechigai.kimito.link)",
      },
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
    });
  } catch {
    // noop
  }
}

/**
 * 共有地点情報から、シェア時にクローラーが実際に取りに来るのと同じ画像URLを組む。
 * シェア側（api/u/[slug].ts・server/routers/ogp.ts）と同じ組み立てを通すこと。
 * URLが1文字でも違うと別キャッシュキーになり、ウォームの意味が無くなる。
 */
export function buildWarmTargetUrl(
  location: ShareLocationInfo | null,
  username: string | null,
): string {
  return buildOgRedirectImageTarget({
    origin: APP_ORIGIN,
    location,
    username,
    version: location?.recordedAt?.getTime() ?? Date.now(),
  });
}
