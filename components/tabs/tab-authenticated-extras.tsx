/**
 * 認証済みタブのみ — チュートリアル等（presence は AuthenticatedPresenceShell で先行起動）。
 */
import { EventReminderRunner } from "@/components/presence/event-reminder-runner";
import { EncounterArrivalToast } from "@/components/presence/encounter-arrival-toast";
import { TutorialHub } from "@/components/organisms/tutorial-hub";

export function TabAuthenticatedExtras() {
  return (
    <>
      <EventReminderRunner />
      {/* すれちがい到着のアプリ内通知。useToast を使うため ToastProvider
          （= ClerkRootProvider）の内側であるここに置く必要がある */}
      <EncounterArrivalToast />
      <TutorialHub />
    </>
  );
}
