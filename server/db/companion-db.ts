import { getDb, eq, desc } from "./connection";
import { participationCompanions, InsertParticipationCompanion } from "../../drizzle/schema";

export async function createCompanion(companion: InsertParticipationCompanion) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(participationCompanions).values(companion);
  return result.insertId ?? null;
}

export async function createCompanions(companions: InsertParticipationCompanion[]) {
  const db = await getDb();
  if (!db) return [];
  if (companions.length === 0) return [];
  const [result] = await db.insert(participationCompanions).values(companions);
  // Bulk insert returns id of the first inserted row
  return result.insertId;
}

export async function getCompanionsForParticipation(participationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participationCompanions).where(eq(participationCompanions.participationId, participationId)).orderBy(participationCompanions.createdAt);
}

export async function getCompanionsForChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participationCompanions).where(eq(participationCompanions.challengeId, challengeId)).orderBy(desc(participationCompanions.createdAt));
}

export async function deleteCompanion(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(participationCompanions).where(eq(participationCompanions.id, id));
}

export async function deleteCompanionsForParticipation(participationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(participationCompanions).where(eq(participationCompanions.participationId, participationId));
}

// 友人の招待実績を取得
export async function getCompanionInviteStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalInvited: 0, companions: [] };

  const companions = await db.select().from(participationCompanions).where(eq(participationCompanions.invitedByUserId, userId)).orderBy(desc(participationCompanions.createdAt));

  return {
    totalInvited: companions.length,
    companions,
  };
}
