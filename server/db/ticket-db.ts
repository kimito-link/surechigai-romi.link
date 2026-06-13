import { getDb, eq, desc, sql, and } from "./connection";
import { ticketTransfers, ticketWaitlist, participations, participationCompanions, challenges, InsertTicketTransfer, InsertTicketWaitlist } from "../../drizzle/schema";

// ========== Ticket Transfers (チケット譲渡) ==========

// 譲渡投稿を作成
export async function createTicketTransfer(transfer: InsertTicketTransfer) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(ticketTransfers).values(transfer);
  return result.insertId ?? null;
}

// 譲渡投稿を取得（チャレンジ別）
export async function getTicketTransfersForChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketTransfers)
    .where(and(
      eq(ticketTransfers.challengeId, challengeId),
      eq(ticketTransfers.status, "available")
    ))
    .orderBy(desc(ticketTransfers.createdAt));
}

// 譲渡投稿を取得（ユーザー別）
export async function getTicketTransfersForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketTransfers)
    .where(eq(ticketTransfers.userId, userId))
    .orderBy(desc(ticketTransfers.createdAt));
}

// 譲渡投稿のステータスを更新
export async function updateTicketTransferStatus(id: number, status: "available" | "reserved" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  await db.update(ticketTransfers).set({ status }).where(eq(ticketTransfers.id, id));
}

// 譲渡投稿を削除（キャンセル）
export async function cancelTicketTransfer(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(ticketTransfers)
    .set({ status: "cancelled" })
    .where(and(eq(ticketTransfers.id, id), eq(ticketTransfers.userId, userId)));
  return true;
}

// ========== Ticket Waitlist (チケット待機リスト) ==========

// 待機リストに登録
export async function addToTicketWaitlist(waitlist: InsertTicketWaitlist) {
  const db = await getDb();
  if (!db) return null;

  // 既に登録済みかチェック
  const existing = await db.select().from(ticketWaitlist)
    .where(and(
      eq(ticketWaitlist.challengeId, waitlist.challengeId),
      eq(ticketWaitlist.userId, waitlist.userId),
      eq(ticketWaitlist.isActive, true)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id; // 既に登録済み
  }

  const [result] = await db.insert(ticketWaitlist).values(waitlist);
  return result.insertId ?? null;
}

// 待機リストから削除
export async function removeFromTicketWaitlist(challengeId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(ticketWaitlist)
    .set({ isActive: false })
    .where(and(
      eq(ticketWaitlist.challengeId, challengeId),
      eq(ticketWaitlist.userId, userId)
    ));
  return true;
}

// 待機リストを取得（チャレンジ別）
export async function getTicketWaitlistForChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketWaitlist)
    .where(and(
      eq(ticketWaitlist.challengeId, challengeId),
      eq(ticketWaitlist.isActive, true)
    ))
    .orderBy(ticketWaitlist.createdAt);
}

// 待機リストを取得（ユーザー別）
export async function getTicketWaitlistForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketWaitlist)
    .where(and(
      eq(ticketWaitlist.userId, userId),
      eq(ticketWaitlist.isActive, true)
    ))
    .orderBy(desc(ticketWaitlist.createdAt));
}

// ユーザーが待機リストに登録しているかチェック
export async function isUserInWaitlist(challengeId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(ticketWaitlist)
    .where(and(
      eq(ticketWaitlist.challengeId, challengeId),
      eq(ticketWaitlist.userId, userId),
      eq(ticketWaitlist.isActive, true)
    ))
    .limit(1);
  return result.length > 0;
}

// 待機者に通知を送る（新しい譲渡投稿があった時）
export async function getWaitlistUsersForNotification(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketWaitlist)
    .where(and(
      eq(ticketWaitlist.challengeId, challengeId),
      eq(ticketWaitlist.isActive, true),
      eq(ticketWaitlist.notifyOnNew, true)
    ));
}

// ========== 参加キャンセル ==========

// 参加をキャンセル
export async function cancelParticipation(participationId: number, userId: number) {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  // 参加情報を取得
  const participation = await db.select().from(participations)
    .where(and(
      eq(participations.id, participationId),
      eq(participations.userId, userId)
    ))
    .limit(1);

  if (participation.length === 0) {
    return { success: false, error: "Participation not found" };
  }

  const p = participation[0];

  // 参加を削除
  await db.delete(participations).where(eq(participations.id, participationId));

  // 同伴者も削除
  await db.delete(participationCompanions).where(eq(participationCompanions.participationId, participationId));

  // チャレンジの現在値を更新
  await db.update(challenges)
    .set({ currentValue: sql`${challenges.currentValue} - ${p.contribution}` })
    .where(eq(challenges.id, p.challengeId));

  return { success: true, challengeId: p.challengeId, contribution: p.contribution };
}
