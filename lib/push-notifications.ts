import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationTriggerFor } from "@/shared/update-notice";

const PUSH_TOKEN_KEY = "expo_push_token";
const NOTIFICATION_SETTINGS_KEY = "notification_settings";

/** app.config.ts extra.eas.projectId と同じ。Constants に無いときの予備。 */
export const EAS_PROJECT_ID_FALLBACK = "a58f673f-25cd-4713-9d1c-0d1062a68426";

/** Android 8+ はチャネルが無い通知を捨てる。更新と新しい内容はここへ出す。 */
export const UPDATE_CHANNEL_ID = "updates";

let handlerInstalled = false;

function installNotificationHandler(): void {
  if (handlerInstalled || Platform.OS === "web") return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function resolveExpoProjectId(): string {
  const fromEnv = process.env.EXPO_PUBLIC_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const fromConstants = extra?.eas?.projectId?.trim();
  if (fromConstants) return fromConstants;
  return EAS_PROJECT_ID_FALLBACK;
}

/**
 * 許可と Android チャネルを用意する。トークン取得に失敗してもローカル通知は出せる。
 * 拒否済みのときは毎回聞き直さない。
 */
export async function prepareLocalNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  installNotificationHandler();
  try {
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.status === "granted";
    if (!granted) {
      if (existing.status === "denied" && existing.canAskAgain === false) return false;
      if (existing.status === "denied") return false;
      const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      granted = requested.status === "granted";
    }
    if (!granted) return false;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(UPDATE_CHANNEL_ID, {
        name: "更新と新しい内容",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }
    return true;
  } catch (error) {
    console.error("[Push] prepare failed:", error);
    return false;
  }
}

export interface NotificationSettings {
  enabled: boolean;
  challengeUpdates: boolean;
  goalReached: boolean;
  milestones: boolean;
  newParticipants: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  challengeUpdates: true,
  goalReached: true,
  milestones: true,
  newParticipants: true,
};

/**
 * プッシュ通知の許可をリクエストしてトークンを取得
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("[Push] Web platform - skipping push notification registration");
    return null;
  }

  const ready = await prepareLocalNotifications();
  if (!ready) {
    console.log("[Push] Permission not granted");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: resolveExpoProjectId(),
    });
    const token = tokenData.data;

    // トークンを保存
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    console.log("[Push] Token registered:", token.substring(0, 20) + "...");

    return token;
  } catch (error) {
    console.error("[Push] Registration error:", error);
    return null;
  }
}

/**
 * 保存されたプッシュトークンを取得
 */
export async function getPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * 通知設定を取得
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 通知設定を保存
 */
export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[Push] Failed to save settings:", error);
  }
}

/**
 * ローカル通知をスケジュール。Android の channelId は content ではなく trigger に載せる。
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("[Push] Web platform - skipping local notification");
    return null;
  }

  const ready = await prepareLocalNotifications();
  if (!ready) return null;

  try {
    const settings = await getNotificationSettings();
    if (!settings.enabled) {
      console.log("[Push] Notifications disabled");
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: notificationTriggerFor(
        Platform.OS,
        trigger,
        UPDATE_CHANNEL_ID,
      ) as Notifications.NotificationTriggerInput,
    });

    console.log("[Push] Notification scheduled:", id);
    return id;
  } catch (error) {
    console.error("[Push] Failed to schedule notification:", error);
    return null;
  }
}

/**
 * チャレンジ達成通知
 */
export async function notifyChallengeGoalReached(
  challengeTitle: string,
  goalValue: number,
  unit: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.goalReached) return;

  await scheduleLocalNotification(
    "🎉 目標達成！",
    `「${challengeTitle}」が目標の${goalValue}${unit}を達成しました！`,
    { type: "goal_reached" }
  );
}

/**
 * マイルストーン達成通知
 */
export async function notifyMilestoneReached(
  challengeTitle: string,
  milestone: number,
  currentValue: number,
  unit: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.milestones) return;

  await scheduleLocalNotification(
    `🏆 ${milestone}%達成！`,
    `「${challengeTitle}」が${currentValue}${unit}に到達しました！`,
    { type: `milestone_${milestone}` }
  );
}

/**
 * 新規参加者通知
 */
export async function notifyNewParticipant(
  challengeTitle: string,
  participantName: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.newParticipants) return;

  await scheduleLocalNotification(
    "👋 新しい参加者！",
    `${participantName}さんが「${challengeTitle}」に参加しました！`,
    { type: "new_participant" }
  );
}

/**
 * イベント開始リマインダー通知
 */
export async function scheduleEventReminder(
  challengeId: number,
  challengeTitle: string,
  eventDate: Date,
  reminderMinutesBefore: number = 60
): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.challengeUpdates) return null;

  const reminderTime = new Date(eventDate.getTime() - reminderMinutesBefore * 60 * 1000);
  
  // 過去の時間の場合はスキップ
  if (reminderTime <= new Date()) {
    console.log("[Push] Reminder time is in the past, skipping");
    return null;
  }

  return await scheduleLocalNotification(
    "⏰ まもなく開始！",
    `「${challengeTitle}」があと${reminderMinutesBefore}分で始まります！`,
    { type: "event_reminder", challengeId },
    { type: SchedulableTriggerInputTypes.DATE, date: reminderTime }
  );
}

/**
 * 通知リスナーを設定
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * 通知タップリスナーを設定
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * すべての通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 特定の通知をキャンセル
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
