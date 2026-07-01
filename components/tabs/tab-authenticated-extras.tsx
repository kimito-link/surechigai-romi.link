/**
 * 認証済みタブのみ — presence / チュートリアル / オンボード後 intro。
 * ゲスト初回 bundle から分離。
 */
import { LivePresenceRunner } from "@/components/presence/live-presence-runner";
import { EventReminderRunner } from "@/components/presence/event-reminder-runner";
import { PostLoginLocationIntro } from "@/features/onboarding/components/PostLoginLocationIntro";
import { TutorialHub } from "@/components/organisms/tutorial-hub";

export function TabAuthenticatedExtras() {
  return (
    <>
      <LivePresenceRunner />
      <EventReminderRunner />
      <PostLoginLocationIntro />
      <TutorialHub />
    </>
  );
}
