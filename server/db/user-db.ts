import { getDb, eq, desc } from "./connection";
import { InsertUser, users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "prefecture"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.gender !== undefined) {
      values.gender = user.gender;
      updateSet.gender = user.gender;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.lastSignedIn));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return true;
}


/**
 * twitterIdでユーザーを取得（外部共有URL用）
 * openIdは "twitter:{twitterId}" の形式
 */
export async function getUserByTwitterId(twitterId: string) {
  const db = await getDb();
  if (!db) return null;

  const openId = `twitter:${twitterId}`;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  if (result.length === 0) return null;

  const user = result[0];

  // twitterUsernameを取得するためにtwitterFollowStatusを確認
  const { twitterFollowStatus } = await import("../../drizzle/schema");
  const followStatus = await db
    .select({ twitterUsername: twitterFollowStatus.twitterUsername })
    .from(twitterFollowStatus)
    .where(eq(twitterFollowStatus.userId, user.id))
    .limit(1);

  return {
    id: user.id,
    name: user.name,
    twitterId: twitterId,
    twitterUsername: followStatus.length > 0 ? followStatus[0].twitterUsername : null,
    gender: user.gender,
  };
}
