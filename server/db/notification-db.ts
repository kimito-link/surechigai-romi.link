import { getDb, eq, desc, and, lt } from "./connection";
import { notificationSettings, notifications, InsertNotificationSetting, InsertNotification } from "../../drizzle/schema";

export async function getNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
  return result[0] || null;
}

export async function upsertNotificationSettings(userId: number, challengeId: number, data: Partial<InsertNotificationSetting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(notificationSettings)
    .where(and(eq(notificationSettings.userId, userId), eq(notificationSettings.challengeId, challengeId)));

  if (existing.length > 0) {
    await db.update(notificationSettings).set(data)
      .where(and(eq(notificationSettings.userId, userId), eq(notificationSettings.challengeId, challengeId)));
  } else {
    await db.insert(notificationSettings).values({ userId, challengeId, ...data });
  }
}

export async function getUsersWithNotificationEnabled(challengeId: number, notificationType: "goal" | "milestone" | "participant") {
  const db = await getDb();
  if (!db) return [];

  // チャレンジの通知設定を取得
  const settingsList = await db.select().from(notificationSettings)
    .where(eq(notificationSettings.challengeId, challengeId));

  return settingsList.filter(s => {
    if (notificationType === "goal") return s.onGoalReached;
    if (notificationType === "milestone") return s.onMilestone25 || s.onMilestone50 || s.onMilestone75;
    if (notificationType === "participant") return s.onNewParticipant;
    return false;
  });
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(notifications).values(data);
  const notificationId = result.insertId ?? null;

  // WebSocketで通知を配信
  try {
    const { sendNotificationToUser } = await import("../websocket");
    sendNotificationToUser(data.userId.toString(), {
      id: notificationId,
      ...data,
    });
  } catch (error) {
    console.error("[WebSocket] Failed to send notification:", error);
  }

  return notificationId;
}

export async function getNotificationsByUserId(
  userId: number,
  limit: number = 20,
  cursor?: number
) {
  const db = await getDb();
  if (!db) return [];

  // cursorがある場合は、そのidより小さい通知を取得
  const conditions = cursor
    ? and(eq(notifications.userId, userId), lt(notifications.id, cursor))
    : eq(notifications.userId, userId);

  return db.select().from(notifications)
    .where(conditions)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
