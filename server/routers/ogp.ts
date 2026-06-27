/**
 * server/routers/ogp.ts
 *
 * OGP画像生成関連のルーター
 * 君斗りんくのすれ違ひ通信: すれ違いエリアの市区町村OGP画像を生成、集まりのOGPメタ
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db/connection.js";
import { getEventById } from "../../modules/event/db/queries.js";
import { TRPCError } from "@trpc/server";

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
});
