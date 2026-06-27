/**
 * server/routers/index.ts
 *
 * 全ルーターを統合してappRouterを作成
 */
import { router } from "../_core/trpc.js";

// 個別ルーターをインポート
import { authRouter } from "./auth.js";
import { ogpRouter } from "./ogp.js";
import { devRouter } from "./dev.js";

// encounter モジュールルーター
import { encounterRouter } from "../../modules/encounter/api/encounter.js";
import { zukanRouter } from "../../modules/encounter/api/zukan.js";
import { safetyRouter } from "../../modules/encounter/api/safety.js";
import { settingsRouter } from "../../modules/encounter/api/settings.js";
import { visitRouter } from "../../modules/encounter/api/visit.js";

// event モジュールルーター（予定×ライブ表明。doin-challenge にも移植する共通機能）
import { eventRouter } from "../../modules/event/api/event.js";

// 統合ルーター
export const appRouter = router({
  auth: authRouter,
  ogp: ogpRouter,
  dev: devRouter,
  encounter: encounterRouter,
  zukan: zukanRouter,
  safety: safetyRouter,
  settings: settingsRouter,
  visit: visitRouter,
  event: eventRouter,
});

export type AppRouter = typeof appRouter;

// 個別ルーターも再エクスポート
export {
  authRouter,
  ogpRouter,
  devRouter,
  encounterRouter,
  zukanRouter,
  safetyRouter,
  settingsRouter,
  visitRouter,
  eventRouter,
};
