/**
 * modules/encounter/db/account-deletion.ts
 *
 * アカウント削除（退会）。App Store Guideline 5.1.1(v) が「アプリ内にアカウント削除の
 * 導線」を必須としているため実装している。削除は不可逆。
 *
 * 方針:
 * - 本人に紐づくデータは物理削除する（locations の deletedAt によるソフト削除とは別物。
 *   ソフト削除は「自分の地図から消す」ためのもので、退会は行そのものを消す）。
 * - encounters は相手にも紐づく共有レコードなので、どちらか一方が退会したら削除する
 *   （片側だけ残すと相手側の一覧で解決できない参照になるため）。
 * - reports（通報）は「通報された側の記録」として運営が保持する必要があるので、
 *   通報者としての行だけ消し、被通報者としての記録は残す。
 * - users 行は最後に消す（他テーブルが userId を参照しているため）。
 *
 * 外部キー制約は貼られていない（スキーマ上 integer のみ）ため、順序は
 * 参照整合性ではなく「途中で失敗したときに何が残ると困るか」で決めている。
 */
import { eq, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../drizzle/schema/index.js";
import {
  locations,
  encounters,
  reactions,
  visitedAreas,
  blocks,
  reports,
  userSettings,
  users,
  events,
  eventParticipations,
  adUserDailyCaps,
  twitterFollowStatus,
  userTwitterTokens,
} from "../../../drizzle/schema/index.js";

type DB = PostgresJsDatabase<typeof schema>;

export type AccountDeletionResult = {
  ok: boolean;
  /** 削除した足あとの件数（利用者への表示用） */
  deletedLocations: number;
};

/**
 * userId に紐づくデータを全て削除し、最後に users 行を消す。
 *
 * 呼び出し側（tRPC）は、これが成功した後に Clerk 側のセッションを破棄すること。
 * Clerk 上のユーザー自体は残るため、同じXアカウントで再度サインアップできる
 * （その場合は新しい userId の新規ユーザーとして扱われる）。
 */
export async function deleteUserAccount(
  db: DB,
  userId: number,
): Promise<AccountDeletionResult> {
  // 表示用に、消える足あとの件数を先に数えておく
  const existing = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.userId, userId));
  const deletedLocations = existing.length;

  // X連携トークンは userId ではなく openId で紐づくので、users 行を消す前に控える
  const userRows = await db
    .select({ openId: users.openId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const openId = userRows[0]?.openId ?? null;

  // すれ違い履歴（相手との共有レコード。どちらが退会しても意味を失うため両方向を削除）
  await db
    .delete(encounters)
    .where(or(eq(encounters.userAId, userId), eq(encounters.userBId, userId)));

  // 自分が送ったリアクション
  await db.delete(reactions).where(eq(reactions.senderId, userId));

  // ブロック（自分がした側・された側の両方）
  await db
    .delete(blocks)
    .where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId)));

  // 通報は「自分が通報した側」のみ削除。被通報者としての記録は運営判断のため残す
  await db.delete(reports).where(eq(reports.reporterId, userId));

  // 位置・訪問
  // （groupVisitReports は visitorToken ベースの匿名申告で userId を持たないため対象外）
  await db.delete(visitedAreas).where(eq(visitedAreas.userId, userId));
  await db.delete(locations).where(eq(locations.userId, userId));

  // 集まり（主催した集まりと、参加表明）
  await db.delete(eventParticipations).where(eq(eventParticipations.userId, userId));
  await db.delete(events).where(eq(events.creatorId, userId));

  // 設定・広告表示回数・X連携
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  await db.delete(adUserDailyCaps).where(eq(adUserDailyCaps.userId, userId));
  await db.delete(twitterFollowStatus).where(eq(twitterFollowStatus.userId, userId));
  if (openId) {
    await db.delete(userTwitterTokens).where(eq(userTwitterTokens.openId, openId));
  }

  // 最後に本体
  await db.delete(users).where(eq(users.id, userId));

  return { ok: true, deletedLocations };
}
