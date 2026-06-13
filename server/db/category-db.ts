import { getDb, eq, desc } from "./connection";
import { categories, challenges, InsertCategory } from "../../drizzle/schema";

// カテゴリキャッシュ（カテゴリはあまり変更されないので長めのTTL）
let categoriesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CATEGORIES_CACHE_TTL = 5 * 60 * 1000; // 5分

export async function getAllCategories() {
  const now = Date.now();

  // キャッシュが有効なら即座に返す
  if (categoriesCache.data && (now - categoriesCache.timestamp) < CATEGORIES_CACHE_TTL) {
    return categoriesCache.data;
  }

  const db = await getDb();
  if (!db) return categoriesCache.data ?? [];

  const result = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);

  // キャッシュを更新
  categoriesCache = { data: result, timestamp: now };

  return result;
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.id, id));
  return result[0] || null;
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.slug, slug));
  return result[0] || null;
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(categories).values(category);
  return result.insertId ?? null;
}

export async function getChallengesByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challenges).where(eq(challenges.categoryId, categoryId)).orderBy(desc(challenges.eventDate));
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(categories).set(data).where(eq(categories.id, id));
  return getCategoryById(id);
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}
