import { getDb, eq, desc, sql, and } from "./connection";
import { invitations, invitationUses, InsertInvitation, InsertInvitationUse } from "../../drizzle/schema";

export async function createInvitation(invitation: InsertInvitation) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invitations).values(invitation);
  return result.insertId ?? null;
}

export async function getInvitationByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitations).where(eq(invitations.code, code));
  return result[0] || null;
}

export async function getInvitationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitations).where(eq(invitations.id, id));
  return result[0] || null;
}

export async function getInvitationsForChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.challengeId, challengeId)).orderBy(desc(invitations.createdAt));
}

export async function getInvitationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.inviterId, userId)).orderBy(desc(invitations.createdAt));
}

export async function incrementInvitationUseCount(code: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ useCount: sql`${invitations.useCount} + 1` }).where(eq(invitations.code, code));
}

export async function deactivateInvitation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ isActive: false }).where(eq(invitations.id, id));
}

export async function recordInvitationUse(use: InsertInvitationUse) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invitationUses).values(use);
  return result.insertId ?? null;
}

// v6.08: 招待された人が参加表明したときに確認フラグを更新
export async function confirmInvitationUse(invitationId: number, userId: number, participationId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.update(invitationUses)
    .set({
      isConfirmed: true,
      confirmedAt: new Date(),
      participationId,
    })
    .where(and(
      eq(invitationUses.invitationId, invitationId),
      eq(invitationUses.userId, userId)
    ));
  return true;
}

// v6.08: ユーザーの招待実績を取得
export async function getUserInvitationStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalInvited: 0, confirmedCount: 0 };

  // ユーザーが作成した招待の使用回数を取得
  const invitationsList = await db.select({ id: invitations.id })
    .from(invitations)
    .where(eq(invitations.inviterId, userId));

  if (invitationsList.length === 0) return { totalInvited: 0, confirmedCount: 0 };

  const invitationIds = invitationsList.map(i => i.id);

  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(invitationUses)
    .where(sql`${invitationUses.invitationId} IN (${sql.join(invitationIds.map(id => sql`${id}`), sql`, `)})`);

  const confirmedResult = await db.select({ count: sql<number>`count(*)` })
    .from(invitationUses)
    .where(and(
      sql`${invitationUses.invitationId} IN (${sql.join(invitationIds.map(id => sql`${id}`), sql`, `)})`,
      eq(invitationUses.isConfirmed, true)
    ));

  return {
    totalInvited: totalResult[0]?.count || 0,
    confirmedCount: confirmedResult[0]?.count || 0,
  };
}

// v6.08: チャレンジの招待経由参加者一覧を取得
export async function getInvitedParticipants(challengeId: number, inviterId: number) {
  const db = await getDb();
  if (!db) return [];

  // このユーザーが作成したこのチャレンジの招待を取得
  const invitationsList = await db.select({ id: invitations.id })
    .from(invitations)
    .where(and(
      eq(invitations.challengeId, challengeId),
      eq(invitations.inviterId, inviterId)
    ));

  if (invitationsList.length === 0) return [];

  const invitationIds = invitationsList.map(i => i.id);

  // 招待経由の参加者を取得
  return db.select({
    id: invitationUses.id,
    displayName: invitationUses.displayName,
    twitterUsername: invitationUses.twitterUsername,
    isConfirmed: invitationUses.isConfirmed,
    confirmedAt: invitationUses.confirmedAt,
    createdAt: invitationUses.createdAt,
  })
    .from(invitationUses)
    .where(sql`${invitationUses.invitationId} IN (${sql.join(invitationIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(invitationUses.createdAt));
}

export async function getInvitationUses(invitationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitationUses).where(eq(invitationUses.invitationId, invitationId)).orderBy(desc(invitationUses.createdAt));
}

export async function getInvitationStats(invitationId: number) {
  const db = await getDb();
  if (!db) return { useCount: 0, participationCount: 0 };

  const uses = await db.select({ count: sql<number>`count(*)` }).from(invitationUses).where(eq(invitationUses.invitationId, invitationId));
  const participations_count = await db.select({ count: sql<number>`count(*)` }).from(invitationUses)
    .where(and(eq(invitationUses.invitationId, invitationId), sql`${invitationUses.participationId} IS NOT NULL`));

  return {
    useCount: uses[0]?.count || 0,
    participationCount: participations_count[0]?.count || 0,
  };
}
