import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { syncEventReminders, resyncEventRemindersFromStorage } from "@/lib/event-reminders";

/** ログイン中ユーザーの集まりリマインドを同期（タブ常駐）。 */
export function useEventReminderSync(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? isAuthenticated;

  const { data: upcoming } = trpc.eventParticipation.myUpcoming.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      void resyncEventRemindersFromStorage();
    }
  }, []);

  useEffect(() => {
    if (!enabled || !upcoming) return;
    void syncEventReminders(
      upcoming.map((item) => ({
        eventId: item.eventId,
        title: item.title,
        startAt: item.startAt,
        reminderEnabled: item.reminderEnabled,
      })),
    );
  }, [enabled, upcoming]);
}
