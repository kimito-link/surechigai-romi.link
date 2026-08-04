/**
 * server/routers/ogp.ts
 *
 * OGP画像生成関連のルーター
 * 君斗りんくのすれ違ひ通信: すれ違いエリアの市区町村OGP画像を生成、集まりのOGPメタ
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db/connection.js";
import { getEventById } from "../../modules/event/db/queries.js";
import { getOrCreateUserShareSlug, getUserShareSlug, getShareInfoBySlug, getPublicTrailByShareSlug } from "../../modules/encounter/db/queries.js";
import { resolveShareDetailedPlace, buildPublicSharePageUrl, featureShareLocationFirst, buildOgRedirectImageTarget } from "../../lib/ogp/share-meta.js";
import { TRPCError } from "@trpc/server";

const APP_ORIGIN = "https://surechigai.kimito.link";

export const ogpRouter = router({
  // エリアのOGPメタデータを取得
  getAreaOgpMeta: publicProcedure
    .input(z.object({ areaName: z.string() }))
    .query(({ input }) => {
      return {
        title: `${input.areaName}でのすれ違い`,
        description: "君斗りんくのすれ違ひ通信で出会いを記録しよう",
        areaName: input.areaName,
      };
    }),

  // イベントのOGPメタデータを取得（Xカード・シェアリンク用）
  getEventOgpMeta: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const ev = await getEventById(db, input.eventId);
      if (!ev || ev.status === "canceled") {
        throw new TRPCError({ code: "NOT_FOUND", message: "イベントが見つかりません" });
      }
      const place =
        ev.locationType === "online"
          ? "オンライン"
          : ev.prefecture ?? "場所未定";
      const start = new Date(ev.startAt);
      const mm = start.getMonth() + 1;
      const dd = start.getDate();
      const hh = String(start.getHours()).padStart(2, "0");
      const mi = String(start.getMinutes()).padStart(2, "0");
      return {
        title: ev.title,
        description: `${ev.creatorName ?? "クリエイター"} が${place}で集まりを開きます。${mm}/${dd} ${hh}:${mi}〜`,
        creatorName: ev.creatorName,
        creatorXId: ev.creatorXId,
      };
    }),

  /**
   * 公開共有スラッグから、最後の記録地点を解決（未ログイン閲覧可）。
   * /u/<slug> 画面と OGP 生成の両方で使う。
   */
  getShareBySlug: publicProcedure
    .input(z.object({ slug: z.string().regex(/^[A-Za-z0-9]{1,16}$/) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const viewerId = ctx.user && ctx.user.id > 0 ? ctx.user.id : null;
      const info = await getShareInfoBySlug(db, input.slug, viewerId);
      if (!info) throw new TRPCError({ code: "NOT_FOUND", message: "共有リンクが見つかりません" });
      return {
        name: info.name,
        username: info.username,
        area: info.area,
        prefecture: info.prefecture,
        lat: info.lat,
        lng: info.lng,
        hasLocation: info.hasLocation,
        zoom: info.zoom,
        precise: info.precise,
        recordedAt: info.recordedAt?.toISOString() ?? null,
      };
    }),

  /**
   * 公開共有スラッグから軌跡一覧（地図 + 最近の記録）を返す。
   * 都道府県クリエイター一覧のカードタップ先 /u/<slug> 用。
   */
  getTrailBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().regex(/^[A-Za-z0-9]{1,16}$/),
        limit: z.number().int().min(1).max(500).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const viewerId = ctx.user && ctx.user.id > 0 ? ctx.user.id : null;
      const trail = await getPublicTrailByShareSlug(db, input.slug, input.limit ?? 120, viewerId);
      if (!trail) throw new TRPCError({ code: "NOT_FOUND", message: "共有リンクが見つかりません" });
      const shareInfo = await getShareInfoBySlug(db, input.slug, viewerId);
      const orderedLocations = featureShareLocationFirst(
        trail.locations,
        shareInfo
          ? {
              area: shareInfo.area,
              prefecture: shareInfo.prefecture,
              lat: shareInfo.lat,
              lng: shareInfo.lng,
              hasLocation: shareInfo.hasLocation,
              zoom: shareInfo.zoom,
              recordedAt: shareInfo.recordedAt,
            }
          : null,
      );
      return {
        ...trail,
        locations: orderedLocations.map((loc) => ({
          ...loc,
          recordedAt: loc.recordedAt.toISOString(),
        })),
        visited: trail.visited.map((v) => ({
          ...v,
          lastVisitedAt: v.lastVisitedAt.toISOString(),
        })),
      };
    }),

  /**
   * OGP画像の事前ウォーム対象URLだけを返す（読み取り専用・本人のみ）。
   *
   * チェックイン完了の時点でブラウザに温めさせるための入口(2026-08-04)。
   * シェアのタップを待つと X のクローラー到着に間に合わないことがあるため、
   * 結果画面が出た段階で先に温める。ここでも **サーバーからは fetch しない**
   * （未解決 Promise が Vercel の関数終了を止める。getOrCreateShareSlug のコメント参照）。
   *
   * slug が未発行のユーザーには null を返す（ここで発行はしない＝副作用を持たない）。
   */
  getShareWarmTarget: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { warmImageUrl: null };
    try {
      const slug = await getUserShareSlug(db, ctx.user.id);
      if (!slug) return { warmImageUrl: null };
      const info = await getShareInfoBySlug(db, slug, ctx.user.id, {
        ogpContext: true,
        skipUsernameLookup: true,
      });
      const version = info?.recordedAt?.getTime() ?? null;
      // recordedAt が無いと og:image 側は v= に Date.now() を使うので必ず別URLになる。
      // 温めても無駄なので諦める（「効いているつもり」を作らない）。
      if (!info || version == null) return { warmImageUrl: null };
      return {
        warmImageUrl: buildOgRedirectImageTarget({
          origin: APP_ORIGIN,
          location: {
            area: info.area,
            prefecture: info.prefecture,
            address: info.address,
            lat: info.lat,
            lng: info.lng,
            hasLocation: info.hasLocation,
            zoom: info.zoom,
            recordedAt: info.recordedAt,
          },
          username: null,
          version,
        }),
      };
    } catch {
      // ウォームは投機的処理。失敗しても画面には影響させない
      return { warmImageUrl: null };
    }
  }),

  /**
   * このスラッグ付き URL (/u/<slug>) を X で共有すると、
   * 最後の記録地点入りの地図サムネ（OGP）が表示される。
   */
  getOrCreateShareSlug: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
    const slug = await getOrCreateUserShareSlug(db, ctx.user.id);
    if (!slug) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "共有リンクの生成に失敗しました" });
    }
    // 共有テキストは OGP と同じ「最新の公開地点」で解決（本人 context で自宅マスクを緩和）
    let areaLabel: string | null = null;
    let shareUrl = `${APP_ORIGIN}/u/${slug}`;
    /**
     * ブラウザ側で叩いてもらう OGP 画像URL（サーバーからは fetch しない。後述の理由）。
     *
     * ここでURLを組んで返すのが要点(2026-08-04)。以前はクライアントが自前でクエリを
     * 組み立てており、クローラーが取りに来るURLと `v=`/`zoom`/座標がズレて
     * キャッシュキーが分裂 → ウォームのヒット率が構造的にゼロだった。
     * 組み立てを buildOgRedirectImageTarget に一本化すれば構造的にズレない。
     */
    let warmImageUrl: string | null = null;
    try {
      // skipUsernameLookup: この経路はタップ直後の空タブを開いたままユーザーを待たせている。
      // 返すのは地名と URL だけで username は使わないので、Clerk への外部 HTTP を踏ませない。
      const info = await getShareInfoBySlug(db, slug, ctx.user.id, {
        ogpContext: true,
        skipUsernameLookup: true,
      });
      const shareLocation = info
        ? {
            area: info.area,
            prefecture: info.prefecture,
            address: info.address,
            lat: info.lat,
            lng: info.lng,
            hasLocation: info.hasLocation,
            zoom: info.zoom,
            recordedAt: info.recordedAt,
          }
        : null;
      // X の投稿文にも OGP と同じ詳しさの地名を出す（2026-07-31 の方針）
      areaLabel = resolveShareDetailedPlace(shareLocation);
      shareUrl = buildPublicSharePageUrl(
        slug,
        info?.recordedAt ?? null,
        APP_ORIGIN,
        shareLocation,
      );
      // api/u/[slug].ts が og:image に出すURLと同じ組み立てを通す（一致が命）。
      // username は skipUsernameLookup のため解決していないので渡さない。
      // og:image 側も name を出さないので、これで両者は完全一致する。
      //
      // recordedAt が無いときはウォームしない。og:image 側は v= に Date.now() を使うため、
      // ここで組んでも必ず別URLになり温めるだけ無駄（誤ったウォームは実害はないが、
      // 「効いているつもり」が最も危険なので明示的に諦める）。
      const version = info?.recordedAt?.getTime() ?? null;
      warmImageUrl =
        version != null
          ? buildOgRedirectImageTarget({
              origin: APP_ORIGIN,
              location: shareLocation,
              username: null,
              version,
            })
          : null;
    } catch {
      // 地名の解決に失敗してもリンク共有自体は続行
      shareUrl = buildPublicSharePageUrl(slug, null, APP_ORIGIN);
    }
    // ここで OGP 画像のウォームを投げてはいけない（2026-07-31 実機で障害を確認）。
    // Vercel の Serverless は未解決の Promise が残っていると関数を終了させないため、
    // `void`/`.catch()` で待たないつもりでもレスポンスがウォーム完了まで遅延する。
    // シェア導線は prepareSharePopup() でクリック直後に空タブを開く設計なので、
    // その間ユーザーは about:blank と「共有画面を準備しています…」を見続けることになる。
    // 同じ理由で encounter.checkIn 側のウォームも撤去済み。
    // 代わりに warmImageUrl を返し、ブラウザ側(hooks/use-warm-og-image.ts)に叩かせる。
    return { slug, url: shareUrl, areaLabel, warmImageUrl };
  }),
});
