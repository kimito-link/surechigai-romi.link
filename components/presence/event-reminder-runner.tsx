/**
 * 参加表明中の集まりリマインドをバックグラウンドで同期（UI なし）。
 */
import { useAuth } from "@/hooks/use-auth";
import { useEventReminderSync } from "@/hooks/use-event-reminder-sync";

export function EventReminderRunner() {
  const { isAuthenticated } = useAuth();
  useEventReminderSync({ enabled: isAuthenticated });
  return null;
}
