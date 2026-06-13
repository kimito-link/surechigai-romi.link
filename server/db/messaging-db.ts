import { getDb, eq, desc, sql, and, lt } from "./connection";
import { reminders, directMessages, challengeTemplates, InsertReminder, InsertDirectMessage, InsertChallengeTemplate } from "../../drizzle/schema";

// ========== Reminders (リマインダー) ==========

export async function createReminder(reminder: InsertReminder) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(reminders).values(reminder);
  return result.insertId ?? null;
}

export async function getRemindersForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt));
}

export async function getRemindersForChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.challengeId, challengeId)).orderBy(desc(reminders.createdAt));
}

export async function getUserReminderForChallenge(userId: number, challengeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reminders).where(and(eq(reminders.userId, userId), eq(reminders.challengeId, challengeId)));
  return result[0] || null;
}

export async function updateReminder(id: number, updates: Partial<InsertReminder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reminders).set(updates).where(eq(reminders.id, id));
}

export async function deleteReminder(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(reminders).where(eq(reminders.id, id));
}

export async function getPendingReminders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.isSent, false));
}

export async function markReminderAsSent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(reminders).set({ isSent: true, sentAt: new Date() }).where(eq(reminders.id, id));
}

// ========== Direct Messages (DM) ==========

export async function sendDirectMessage(dm: InsertDirectMessage) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(directMessages).values(dm);
  const messageId = result.insertId ?? null;

  // WebSocketでメッセージを配信（受信者にのみ）
  try {
    const { sendMessageToUser } = await import("../websocket");
    sendMessageToUser(dm.toUserId.toString(), {
      id: messageId,
      ...dm,
    });
  } catch (error) {
    console.error("[WebSocket] Failed to send message:", error);
  }

  return messageId;
}

export async function getDirectMessagesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(directMessages)
    .where(sql`${directMessages.fromUserId} = ${userId} OR ${directMessages.toUserId} = ${userId}`)
    .orderBy(desc(directMessages.createdAt));
}

export async function getConversation(userId1: number, userId2: number, challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(directMessages)
    .where(and(
      eq(directMessages.challengeId, challengeId),
      sql`((${directMessages.fromUserId} = ${userId1} AND ${directMessages.toUserId} = ${userId2}) OR (${directMessages.fromUserId} = ${userId2} AND ${directMessages.toUserId} = ${userId1}))`
    ))
    .orderBy(directMessages.createdAt);
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(directMessages)
    .where(and(eq(directMessages.toUserId, userId), eq(directMessages.isRead, false)));
  return result[0]?.count || 0;
}

export async function getDirectMessageById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(directMessages).where(eq(directMessages.id, id));
  return result[0] || null;
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(directMessages).set({ isRead: true, readAt: new Date() }).where(eq(directMessages.id, id));
}

export async function markAllMessagesAsRead(userId: number, fromUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(directMessages).set({ isRead: true, readAt: new Date() })
    .where(and(eq(directMessages.toUserId, userId), eq(directMessages.fromUserId, fromUserId)));
}

export async function getConversationList(
  userId: number,
  limit: number = 20,
  cursor?: number
) {
  const db = await getDb();
  if (!db) return [];

  // cursorがある場合は、そのidより小さいメッセージを取得
  const conditions = cursor
    ? sql`(${directMessages.fromUserId} = ${userId} OR ${directMessages.toUserId} = ${userId}) AND ${directMessages.id} < ${cursor}`
    : sql`${directMessages.fromUserId} = ${userId} OR ${directMessages.toUserId} = ${userId}`;

  // 最新のメッセージを持つ会話相手のリストを取得
  const messages = await db.select().from(directMessages)
    .where(conditions)
    .orderBy(desc(directMessages.createdAt))
    .limit(limit * 3); // ユニークな会話を十分に取得するために多めに取得

  // ユニークな会話相手を抽出
  const conversationMap = new Map<string, typeof messages[0]>();
  for (const msg of messages) {
    if (conversationMap.size >= limit) break; // limitに達したら終了
    const partnerId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
    const key = `${partnerId}-${msg.challengeId}`;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, msg);
    }
  }

  return Array.from(conversationMap.values());
}

// ========== Challenge Templates (テンプレート) ==========

export async function createChallengeTemplate(template: InsertChallengeTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(challengeTemplates).values(template);
  return result.insertId ?? null;
}

export async function getChallengeTemplatesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeTemplates).where(eq(challengeTemplates.userId, userId)).orderBy(desc(challengeTemplates.createdAt));
}

export async function getPublicChallengeTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeTemplates).where(eq(challengeTemplates.isPublic, true)).orderBy(desc(challengeTemplates.useCount));
}

export async function getChallengeTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(challengeTemplates).where(eq(challengeTemplates.id, id));
  return result[0] || null;
}

export async function updateChallengeTemplate(id: number, updates: Partial<InsertChallengeTemplate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeTemplates).set(updates).where(eq(challengeTemplates.id, id));
}

export async function deleteChallengeTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(challengeTemplates).where(eq(challengeTemplates.id, id));
}

export async function incrementTemplateUseCount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeTemplates)
    .set({ useCount: sql`${challengeTemplates.useCount} + 1` })
    .where(eq(challengeTemplates.id, id));
}
