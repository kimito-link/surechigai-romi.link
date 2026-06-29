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
import { getOrCreateUserShareSlug, getShareInfoBySlug, getPublicTrailByShareSlug } from "../../modules/encounter/db/queries.js";
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
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const info = await getShareInfoBySlug(db, input.slug);
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
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続" });
      const trail = await getPublicTrailByShareSlug(db, input.slug, input.limit ?? 120);
      if (!trail) throw new TRPCError({ code: "NOT_FOUND", message: "共有リンクが見つかりません" });
      return {
        ...trail,
        locations: trail.locations.map((loc) => ({
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
    // 共有テキストを市区町村粒度にするため、最新の記録地点の地名も返す。
    let areaLabel: string | null = null;
    try {
      const info = await getShareInfoBySlug(db, slug);
      areaLabel = info?.area ?? info?.prefecture ?? null;
    } catch {
      // 地名の解決に失敗してもリンク共有自体は続行
    }
    return { slug, url: `${APP_ORIGIN}/u/${slug}`, areaLabel };
  }),
});
