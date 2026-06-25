/**
 * server/routers/dev.ts
 *
 * 開発者向けAPI（プレースホルダー）
 * すれちがいロミ: locations/encounters API 実装後に拡張
 */
import { publicProcedure, router } from "../_core/trpc.js";

export const devRouter = router({
  ping: publicProcedure.query(() => {
    return { pong: true, timestamp: new Date().toISOString() };
  }),
});
