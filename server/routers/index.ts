/**
 * server/routers/index.ts
 *
 * 全ルーターを統合してappRouterを作成
 */
import { router } from "../_core/trpc";

// 個別ルーターをインポート
import { authRouter } from "./auth";
import { ogpRouter } from "./ogp";
import { devRouter } from "./dev";

// 統合ルーター
export const appRouter = router({
  auth: authRouter,
  ogp: ogpRouter,
  dev: devRouter,
});

export type AppRouter = typeof appRouter;

// 個別ルーターも再エクスポート
export {
  authRouter,
  ogpRouter,
  devRouter,
};
