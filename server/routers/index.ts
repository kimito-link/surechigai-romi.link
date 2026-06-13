/**
 * server/routers/index.ts
 * 
 * 全ルーターを統合してappRouterを作成
 */
import { router } from "../_core/trpc";

// 個別ルーターをインポート
import { authRouter } from "./auth";
import { eventsRouter } from "./events";
import { participationsRouter } from "./participations";
import { notificationsRouter } from "./notifications";
import { ogpRouter } from "./ogp";
import { badgesRouter } from "./badges";
import { pickedCommentsRouter } from "./picked-comments";
import { prefecturesRouter } from "./prefectures";
import { cheersRouter } from "./cheers";
import { achievementsRouter } from "./achievements";
import { remindersRouter } from "./reminders";
import { dmRouter } from "./dm";
import { templatesRouter } from "./templates";
import { searchRouter } from "./search";
import { followsRouter } from "./follows";
import { rankingsRouter } from "./rankings";
import { categoriesRouter } from "./categories";
import { invitationsRouter } from "./invitations";
import { profilesRouter } from "./profiles";
import { companionsRouter } from "./companions";
import { aiRouter } from "./ai";
import { devRouter } from "./dev";
import { ticketTransferRouter } from "./ticket-transfer";
import { ticketWaitlistRouter } from "./ticket-waitlist";
import { adminRouter } from "./admin";
import { statsRouter } from "./stats";
import { releaseNotesRouter } from "./release-notes";

// 統合ルーター
export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  participations: participationsRouter,
  notifications: notificationsRouter,
  ogp: ogpRouter,
  badges: badgesRouter,
  pickedComments: pickedCommentsRouter,
  prefectures: prefecturesRouter,
  cheers: cheersRouter,
  achievements: achievementsRouter,
  reminders: remindersRouter,
  dm: dmRouter,
  templates: templatesRouter,
  search: searchRouter,
  follows: followsRouter,
  rankings: rankingsRouter,
  categories: categoriesRouter,
  invitations: invitationsRouter,
  profiles: profilesRouter,
  companions: companionsRouter,
  ai: aiRouter,
  dev: devRouter,
  ticketTransfer: ticketTransferRouter,
  ticketWaitlist: ticketWaitlistRouter,
  admin: adminRouter,
  stats: statsRouter,
  releaseNotes: releaseNotesRouter,
});

export type AppRouter = typeof appRouter;

// 個別ルーターも再エクスポート
export {
  statsRouter,
  authRouter,
  eventsRouter,
  participationsRouter,
  notificationsRouter,
  ogpRouter,
  badgesRouter,
  pickedCommentsRouter,
  prefecturesRouter,
  cheersRouter,
  achievementsRouter,
  remindersRouter,
  dmRouter,
  templatesRouter,
  searchRouter,
  followsRouter,
  rankingsRouter,
  categoriesRouter,
  invitationsRouter,
  profilesRouter,
  companionsRouter,
  aiRouter,
  devRouter,
  ticketTransferRouter,
  ticketWaitlistRouter,
  adminRouter,
};
