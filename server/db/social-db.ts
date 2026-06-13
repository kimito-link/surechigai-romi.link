import { getDb, eq, desc, sql, and } from "./connection";
import { cheers, pickedComments, achievementPages, participations, InsertCheer, InsertAchievementPage, InsertPickedComment } from "../../drizzle/schema";

// ========== Picked Comments ==========

export async function getPickedCommentsByChallengeId(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pickedComments).where(eq(pickedComments.challengeId, challengeId)).orderBy(desc(pickedComments.pickedAt));
}

export async function getPickedCommentsWithParticipation(challengeId: number) {
  const db = await getDb();
  if (!db) return [];

  const picked = await db.select().from(pickedComments).where(eq(pickedComments.challengeId, challengeId));
  const participationList = await db.select().from(participations).where(eq(participations.challengeId, challengeId));

  return picked.map(p => ({
    ...p,
    participation: participationList.find(part => part.id === p.participationId),
  }));
}

export async function pickComment(participationId: number, challengeId: number, pickedBy: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 既にピックアップされているかチェック
  const existing = await db.select().from(pickedComments)
    .where(eq(pickedComments.participationId, participationId));

  if (existing.length > 0) return null; // 既にピックアップ済み

  const [result] = await db.insert(pickedComments).values({
    participationId,
    challengeId,
    pickedBy,
    reason,
  });
  return result.insertId ?? null;
}

export async function unpickComment(participationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pickedComments).where(eq(pickedComments.participationId, participationId));
}

export async function markCommentAsUsedInVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pickedComments).set({ isUsedInVideo: true }).where(eq(pickedComments.id, id));
}

export async function isCommentPicked(participationId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(pickedComments).where(eq(pickedComments.participationId, participationId));
  return result.length > 0;
}

// ========== Cheers (エール) ==========

export async function sendCheer(cheer: InsertCheer) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(cheers).values(cheer);
  return result.insertId ?? null;
}

export async function getCheersForParticipation(participationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.toParticipationId, participationId)).orderBy(desc(cheers.createdAt));
}

export async function getCheersForChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.challengeId, challengeId)).orderBy(desc(cheers.createdAt));
}

export async function getCheerCountForParticipation(participationId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(cheers).where(eq(cheers.toParticipationId, participationId));
  return result[0]?.count || 0;
}

export async function getCheersReceivedByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.toUserId, userId)).orderBy(desc(cheers.createdAt));
}

export async function getCheersSentByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.fromUserId, userId)).orderBy(desc(cheers.createdAt));
}

// ========== Achievement Pages (達成記念ページ) ==========

export async function createAchievementPage(page: InsertAchievementPage) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(achievementPages).values(page);
  return result.insertId ?? null;
}

export async function getAchievementPage(challengeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(achievementPages).where(eq(achievementPages.challengeId, challengeId));
  return result[0] || null;
}

export async function updateAchievementPage(challengeId: number, updates: Partial<InsertAchievementPage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(achievementPages).set(updates).where(eq(achievementPages.challengeId, challengeId));
}

export async function getPublicAchievementPages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievementPages).where(eq(achievementPages.isPublic, true)).orderBy(desc(achievementPages.achievedAt));
}
