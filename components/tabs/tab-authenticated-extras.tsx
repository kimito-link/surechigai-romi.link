/**
 * 認証済みタブのみ — チュートリアル等（presence は AuthenticatedPresenceShell で先行起動）。
 */
import { EventReminderRunner } from "@/components/presence/event-reminder-runner";
import { TutorialHub } from "@/components/organisms/tutorial-hub";

export function TabAuthenticatedExtras() {
  return (
    <>
      <EventReminderRunner />
      <TutorialHub />
    </>
  );
}
