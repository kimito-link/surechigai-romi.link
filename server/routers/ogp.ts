/**
 * server/routers/ogp.ts
 *
 * OGP画像生成関連のルーター
 * すれちがいロミ: すれ違いエリアの市区町村OGP画像を生成
 * TODO: encounters API実装後に都道府県・市区町村OGPを実装
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const ogpRouter = router({
  // エリアのOGPメタデータを取得
  getAreaOgpMeta: publicProcedure
    .input(z.object({ areaName: z.string() }))
    .query(({ input }) => {
      return {
        title: `${input.areaName}でのすれ違い`,
        description: "すれちがいロミで出会いを記録しよう",
        areaName: input.areaName,
      };
    }),
});
