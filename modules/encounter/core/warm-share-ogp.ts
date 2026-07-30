/**
 * modules/encounter/core/warm-share-ogp.ts
 *
 * チェックイン直後に、その人のシェア用OGP画像を先回りで生成させる。
 *
 * なぜ必要か: OGP画像の生成は常時 5〜6 秒かかるのに X のクローラーは ~2 秒で諦める。
 * シェアURLには v=<記録時刻> が付くため、新しいチェックインほど必ずキャッシュミスになり
 * 「画像が出るときと出ないときがある」という症状になっていた（実測値は lib/ogp/warm-og-image.ts）。
 * チェックインの時点で温めておけば、シェア時にはキャッシュヒット(0.17秒)で間に合う。
 *
 * すべて best-effort。ここでの失敗はチェックインの成否に一切影響させない。
 */
import { getOrCreateUserShareSlug, getShareInfoBySlug } from "../db/queries.js";
import { warmOgImage, buildWarmTargetUrl } from "../../../lib/ogp/warm-og-image.js";

/**
 * userId の共有スラッグを解決し、シェア時と同一の画像URLを叩いてキャッシュを温める。
 *
 * ogpContext: true はシェア時（api/u/[slug].ts・server/routers/ogp.ts）と同じ解決条件。
 * ここを揃えないと別URLになりウォームが無駄になる。
 */
export async function warmOgImageForUser(
  db: Parameters<typeof getOrCreateUserShareSlug>[0],
  userId: number,
): Promise<void> {
  try {
    const slug = await getOrCreateUserShareSlug(db, userId);
    if (!slug) return;
    const info = await getShareInfoBySlug(db, slug, userId, { ogpContext: true });
    if (!info) return;
    await warmOgImage(
      buildWarmTargetUrl(
        {
          area: info.area,
          prefecture: info.prefecture,
          lat: info.lat,
          lng: info.lng,
          hasLocation: info.hasLocation,
          zoom: info.zoom,
          recordedAt: info.recordedAt,
        },
        info.username ?? null,
      ),
    );
  } catch {
    // noop（チェックインは絶対に止めない）
  }
}
