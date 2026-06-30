/**
 * 集まり開始リマインド — Web Notification / expo-notifications。
 * 1日前・1時間前・15分前に通知（未来の時刻のみ）。
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";

const STORAGE_KEY = "surechigai.eventReminders.scheduled.v1";

/** リマインドを送るタイミング（開始の何分前か） */
export const REMINDER_OFFSETS_MINUTES = [24 * 60, 60, 15] as const;

export type EventReminderSource = {
  eventId: number;
  title: string;
  startAt: string | Date;
  reminderEnabled: boolean;
};

type ScheduledRecord = {
  eventId: number;
  offsetMin: number;
  notificationId?: string;
  fireAt: number;
};

const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function timerKey(eventId: number, offsetMin: number): string {
  return `${eventId}:${offsetMin}`;
}

function formatWhen(startAt: Date, offsetMin: number): string {
  if (offsetMin >= 24 * 60) return "明日";
  if (offsetMin >= 60) return `あと${Math.round(offsetMin / 60)}時間`;
  return `あと${offsetMin}分`;
}

function buildBody(title: string, startAt: Date, offsetMin: number): string {
  const d = startAt;
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const time = `${d.getMonth() + 1}/${d.getDate()}(${wd}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `「${title}」が${formatWhen(startAt, offsetMin)}で始まります（${time}〜）`;
}

/** 通知許可をリクエスト。 */
export async function requestEventReminderPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export function getEventReminderPermissionStatus(): "granted" | "denied" | "default" | "unsupported" {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  }
  return "default";
}

async function showWebNotification(title: string, body: string, eventId: number): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag: `event-reminder-${eventId}`,
      icon: "/favicon-48.png",
    });
  } catch {
    // ignore
  }
}

async function scheduleOneReminder(
  eventId: number,
  title: string,
  startAt: Date,
  offsetMin: number,
): Promise<ScheduledRecord | null> {
  const fireAt = startAt.getTime() - offsetMin * 60 * 1000;
  const now = Date.now();
  if (fireAt <= now) return null;

  const notifTitle = offsetMin >= 24 * 60 ? "📅 明日の集まり" : "⏰ まもなく集まり";
  const body = buildBody(title, startAt, offsetMin);

  if (Platform.OS === "web") {
    const delay = fireAt - now;
    const key = timerKey(eventId, offsetMin);
    const existing = activeTimers.get(key);
    if (existing) clearTimeout(existing);

    const handle = setTimeout(() => {
      void showWebNotification(notifTitle, body, eventId);
      activeTimers.delete(key);
    }, delay);
    activeTimers.set(key, handle);

    return { eventId, offsetMin, fireAt };
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notifTitle,
        body,
        data: { type: "event_reminder", eventId },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
    return { eventId, offsetMin, notificationId: id, fireAt };
  } catch {
    return null;
  }
}

function clearAllActiveTimers(): void {
  for (const handle of activeTimers.values()) clearTimeout(handle);
  activeTimers.clear();
}

async function cancelNativeScheduled(records: ScheduledRecord[]): Promise<void> {
  if (Platform.OS === "web") return;
  for (const r of records) {
    if (r.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(r.notificationId);
      } catch {
        // ignore
      }
    }
  }
}

async function loadStoredRecords(): Promise<ScheduledRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledRecord[];
  } catch {
    return [];
  }
}

async function saveStoredRecords(records: ScheduledRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** 参加表明中の集まりからリマインドを再スケジュール。 */
export async function syncEventReminders(sources: EventReminderSource[]): Promise<void> {
  const prev = await loadStoredRecords();
  clearAllActiveTimers();
  await cancelNativeScheduled(prev);

  const enabled = sources.filter((s) => s.reminderEnabled);
  if (enabled.length === 0) {
    await saveStoredRecords([]);
    return;
  }

  const hasPermission = await requestEventReminderPermission();
  if (!hasPermission) {
    await saveStoredRecords([]);
    return;
  }

  const nextRecords: ScheduledRecord[] = [];
  for (const item of enabled) {
    const startAt = item.startAt instanceof Date ? item.startAt : new Date(item.startAt);
    for (const offsetMin of REMINDER_OFFSETS_MINUTES) {
      const rec = await scheduleOneReminder(item.eventId, item.title, startAt, offsetMin);
      if (rec) nextRecords.push(rec);
    }
  }

  await saveStoredRecords(nextRecords);
}

/** アプリ起動時: 保存済み Web タイマーをクリア（myUpcoming 同期で再構築）。 */
export async function resyncEventRemindersFromStorage(): Promise<void> {
  clearAllActiveTimers();
}
