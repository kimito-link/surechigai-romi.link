import { getDb } from "./connection";
import { generateSlug } from "./connection";
import { challenges, InsertChallenge, users } from "../../drizzle/schema";
import { sql, eq, desc, and, like, or } from "drizzle-orm";
// 後方互換性のためのエイリアス
const events = challenges;
type InsertEvent = InsertChallenge;

/**
 * 本番DBに確実に存在するカラムのみを指定するセーフセレクト
 * aiSummary, intentTags, regionSummary, participantSummary, aiSummaryUpdatedAt は
 * 本番DBに存在しない可能性があるため、NULLリテラルで返す（型互換性を維持）
 */
const safeEventColumns = {
  id: events.id,
  hostUserId: events.hostUserId,
  hostTwitterId: events.hostTwitterId,
  hostName: events.hostName,
  hostUsername: events.hostUsername,
  hostProfileImage: events.hostProfileImage,
  hostFollowersCount: events.hostFollowersCount,
  hostDescription: events.hostDescription,
  title: events.title,
  slug: events.slug,
  description: events.description,
  goalType: events.goalType,
  goalValue: events.goalValue,
  goalUnit: events.goalUnit,
  currentValue: events.currentValue,
  eventType: events.eventType,
  categoryId: events.categoryId,
  eventDate: events.eventDate,
  venue: events.venue,
  prefecture: events.prefecture,
  ticketPresale: events.ticketPresale,
  ticketDoor: events.ticketDoor,
  ticketSaleStart: events.ticketSaleStart,
  ticketUrl: events.ticketUrl,
  externalUrl: events.externalUrl,
  status: events.status,
  isPublic: events.isPublic,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
  // AI関連カラム: 本番DBに存在しない可能性があるため、NULLリテラルで返す
  aiSummary: sql<string | null>`NULL`.as("aiSummary"),
  intentTags: sql<string[] | null>`NULL`.as("intentTags"),
  regionSummary: sql<Record<string, number> | null>`NULL`.as("regionSummary"),
  participantSummary: sql<{ totalCount: number; topContributors: Array<{ name: string; contribution: number; message?: string }>; recentMessages: Array<{ name: string; message: string; createdAt: string }>; hotRegion?: string } | null>`NULL`.as("participantSummary"),
  aiSummaryUpdatedAt: sql<Date | null>`NULL`.as("aiSummaryUpdatedAt"),
} as const;

// サーバーサイドメモリキャッシュ（パフォーマンス最適化）
let eventsCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const EVENTS_CACHE_TTL = 5 * 60 * 1000; // 5分（イベント作成/更新時は invalidateEventsCache() で即時無効化される）

export async function getAllEvents() {
  const now = Date.now();
  
  // キャッシュが有効なら即座に返す
  if (eventsCache.data && (now - eventsCache.timestamp) < EVENTS_CACHE_TTL) {
    return eventsCache.data;
  }
  
  const db = await getDb();
  if (!db) return eventsCache.data ?? [];
  
  try {
    // v6.175: usersテーブルとJOINしてhostGenderを取得
    const result = await db
      .select({
        id: events.id,
        hostUserId: events.hostUserId,
        hostTwitterId: events.hostTwitterId,
        hostName: events.hostName,
        hostUsername: events.hostUsername,
        hostProfileImage: events.hostProfileImage,
        hostFollowersCount: events.hostFollowersCount,
        hostDescription: events.hostDescription,
        hostGender: users.gender, // 主催者の性別
        title: events.title,
        slug: events.slug,
        description: events.description,
        goalType: events.goalType,
        goalValue: events.goalValue,
        goalUnit: events.goalUnit,
        currentValue: events.currentValue,
        eventType: events.eventType,
        categoryId: events.categoryId,
        eventDate: events.eventDate,
        venue: events.venue,
        prefecture: events.prefecture,
        status: events.status,
        isPublic: events.isPublic,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .leftJoin(users, eq(events.hostUserId, users.id))
      .where(eq(events.isPublic, true))
      .orderBy(desc(events.eventDate));
    eventsCache = { data: result, timestamp: now };
    return result;
  } catch (err) {
    // users.gender などスキーマ不一致で失敗した場合のフォールバック（challenges のみ取得）
    console.warn("[getAllEvents] JOIN query failed, falling back to challenges only:", (err as Error)?.message);
    try {
      const fallback = await db
        .select(safeEventColumns)
        .from(events)
        .where(eq(events.isPublic, true))
        .orderBy(desc(events.eventDate));
      eventsCache = { data: fallback, timestamp: now };
      return fallback;
    } catch (fallbackErr) {
      console.error("[getAllEvents] Fallback query also failed:", (fallbackErr as Error)?.message);
      return eventsCache.data ?? [];
    }
  }
}

// キャッシュを無効化（イベント作成/更新/削除時に呼び出す）
export function invalidateEventsCache() {
  eventsCache = { data: null, timestamp: 0 };
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select(safeEventColumns).from(events).where(eq(events.id, id));
    return result[0] || null;
  } catch (err) {
    console.error("[getEventById] Query failed:", (err as Error)?.message);
    return null;
  }
}

export async function getEventsByHostUserId(hostUserId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select(safeEventColumns).from(events).where(eq(events.hostUserId, hostUserId)).orderBy(desc(events.eventDate));
  } catch (err) {
    console.error("[getEventsByHostUserId] Query failed:", (err as Error)?.message);
    return [];
  }
}

export async function getEventsByHostTwitterId(hostTwitterId: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select(safeEventColumns).from(events).where(eq(events.hostTwitterId, hostTwitterId)).orderBy(desc(events.eventDate));
  } catch (err) {
    console.error("[getEventsByHostTwitterId] Query failed:", (err as Error)?.message);
    return [];
  }
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // TiDBのdefaultキーワード問題を回避するため、raw SQLを使用
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const eventDate = data.eventDate ? new Date(data.eventDate).toISOString().slice(0, 19).replace('T', ' ') : now;
  
  // slugを生成（タイトルからスラッグを作成）
  const slug = data.slug || generateSlug(data.title);
  
  // ticketSaleStartの処理
  const ticketSaleStart = data.ticketSaleStart ? new Date(data.ticketSaleStart).toISOString().slice(0, 19).replace('T', ' ') : null;
  
  // AI関連カラム（aiSummary, intentTags, regionSummary, participantSummary, aiSummaryUpdatedAt）は
  // 本番DBに存在しない可能性があるため、INSERTから除外
  // slugカラムも本番DBに存在しないため除外（2024年1月修正）
  // これらのカラムは後から追加する場合は、マイグレーションを実行してから使用する
  const result = await db.execute(sql`
    INSERT INTO challenges (
      "hostUserId", "hostTwitterId", "hostName", "hostUsername", "hostProfileImage", "hostFollowersCount", "hostDescription",
      title, description, "goalType", "goalValue", "goalUnit", "currentValue",
      "eventType", "categoryId", "eventDate", venue, prefecture,
      "ticketPresale", "ticketDoor", "ticketSaleStart", "ticketUrl", "externalUrl",
      status, "isPublic", "createdAt", "updatedAt"
    ) VALUES (
      ${data.hostUserId ?? null},
      ${data.hostTwitterId ?? null},
      ${data.hostName},
      ${data.hostUsername ?? null},
      ${data.hostProfileImage ?? null},
      ${data.hostFollowersCount ?? 0},
      ${data.hostDescription ?? null},
      ${data.title},
      ${data.description ?? null},
      ${data.goalType ?? 'attendance'},
      ${data.goalValue ?? 100},
      ${data.goalUnit ?? '人'},
      ${data.currentValue ?? 0},
      ${data.eventType ?? 'solo'},
      ${data.categoryId ?? null},
      ${eventDate},
      ${data.venue ?? null},
      ${data.prefecture ?? null},
      ${data.ticketPresale ?? null},
      ${data.ticketDoor ?? null},
      ${ticketSaleStart},
      ${data.ticketUrl ?? null},
      ${data.externalUrl ?? null},
      ${data.status ?? 'active'},
      ${data.isPublic ?? true},
      ${now},
      ${now}
    )
    RETURNING id
  `);
  const raw = result as unknown as { rows?: Array<{ id: number }> } | Array<unknown>;
  const rows = Array.isArray(raw) ? raw : raw?.rows;
  const id = (rows?.[0] as { id: number } | undefined)?.id;
  invalidateEventsCache();
  if (id == null) throw new Error("Failed to create challenge");
  return id;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, id));
  invalidateEventsCache(); // キャッシュを無効化
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, id));
  invalidateEventsCache(); // キャッシュを無効化
}


/**
 * チャレンジを検索
 */
export async function searchChallenges(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  // 検索クエリを正規化
  const normalizedQuery = query.toLowerCase().trim();
  
  try {
    // 全チャレンジを取得してフィルタリング（安全なカラムのみ）
    const allChallenges = await db.select(safeEventColumns).from(challenges).where(eq(challenges.isPublic, true)).orderBy(desc(challenges.eventDate));
    
    // タイトル、ホスト名、説明文で検索
    return allChallenges.filter(c => {
      const title = (c.title || "").toLowerCase();
      const hostName = (c.hostName || "").toLowerCase();
      const description = (c.description || "").toLowerCase();
      const venue = (c.venue || "").toLowerCase();
      
      return title.includes(normalizedQuery) ||
             hostName.includes(normalizedQuery) ||
             description.includes(normalizedQuery) ||
             venue.includes(normalizedQuery);
    });
  } catch (err) {
    console.error("[searchChallenges] Query failed:", (err as Error)?.message);
    return [];
  }
}

/**
 * DB側でフィルタ・ページネーションを行うイベント一覧取得
 */
export async function getEventsPaginated(params: {
  cursor: number;
  limit: number;
  filter?: string;
  search?: string;
}): Promise<{ items: any[]; nextCursor: number | undefined; totalCount: number }> {
  const { cursor, limit, filter, search } = params;

  // キャッシュが有効 & フィルタ/検索なしの場合はメモリキャッシュを使用
  const noFilter = (!filter || filter === "all") && (!search || !search.trim());
  const now = Date.now();
  if (noFilter && eventsCache.data && (now - eventsCache.timestamp) < EVENTS_CACHE_TTL) {
    const items = eventsCache.data.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < eventsCache.data.length ? cursor + limit : undefined;
    return { items, nextCursor, totalCount: eventsCache.data.length };
  }

  const db = await getDb();
  if (!db) {
    const fallback = eventsCache.data ?? [];
    const items = fallback.slice(cursor, cursor + limit);
    return { items, nextCursor: cursor + limit < fallback.length ? cursor + limit : undefined, totalCount: fallback.length };
  }

  try {
    // WHERE条件を構築
    const conditions: any[] = [eq(events.isPublic, true)];

    if (filter && filter !== "all") {
      conditions.push(eq(events.eventType, filter as "solo" | "group"));
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(events.title, searchPattern),
          like(events.description, searchPattern),
          like(events.venue, searchPattern),
          like(events.hostName, searchPattern),
        )
      );
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    // COUNT クエリ
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(events)
      .where(whereClause);
    const totalCount = Number(countResult[0]?.count ?? 0);

    // データ取得（安全なカラムのみ + LIMIT + OFFSET）
    const items = await db
      .select(safeEventColumns)
      .from(events)
      .where(whereClause)
      .orderBy(desc(events.eventDate))
      .limit(limit)
      .offset(cursor);

    const nextCursor = cursor + limit < totalCount ? cursor + limit : undefined;
    return { items, nextCursor, totalCount };
  } catch (err) {
    console.warn("[getEventsPaginated] Query failed, falling back to cache:", (err as Error)?.message);
    const fallback = eventsCache.data ?? [];
    const items = fallback.slice(cursor, cursor + limit);
    return { items, nextCursor: cursor + limit < fallback.length ? cursor + limit : undefined, totalCount: fallback.length };
  }
}
