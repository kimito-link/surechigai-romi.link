/**
 * すれちがいロミ: Event（集まり）関連スキーマ
 *
 * 会議ハーネスの合意設計（romi-spec-minutes.md）に基づく:
 *  - 単一の「イベント」エンティティが status で「予定(カレンダー)→ライブ中(在席マップ)→終了」を移ろう。
 *  - 配信専用にしない。種別は typeTags の自由配列（"haishin" / "totsumachi" / "offkai" など）。
 *  - リアル(県・会場名まで) / オンライン(URL) を locationType で両対応。座標は保存しない。
 *  - 公開範囲は public / unlisted（合言葉で入るオフ会向け）。
 *  - creator 情報（X由来）は常に公開。場所は粗い粒度に留める「非対称」を前提とする。
 *
 * このモジュールは姉妹サービス doin-challenge.com にも移植する想定のため、
 * すれちがいロミ固有のテーブル（encounters 等）には依存しない自己完結スキーマにする。
 * DB: Supabase Free (Postgres) / pg-core
 */

import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  serial,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// =============================================================================
// events — クリエイターの「集まり」。予定とライブ表明を1レコードで表す。
// =============================================================================

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    /** 主催クリエイターの users.id */
    creatorId: integer("creatorId").notNull(),
    /**
     * 主催の表示名（作成時にキャッシュ。一覧でJOINせず出すため）。
     * 「誰が＝公開」側。X由来の名前。
     */
    creatorName: text("creatorName"),
    /**
     * 主催の X 数値ID（openId の "twitter:12345" の後半）。
     * X送客リンク https://x.com/i/user/<id> に使う。NULL可（管理者投稿など）。
     */
    creatorXId: varchar("creatorXId", { length: 64 }),

    // --- 内容（配信に密結合しない汎用フィールド） ---
    title: varchar("title", { length: 80 }).notNull(),
    description: text("description"),
    /**
     * 種別タグ（カンマ区切り文字列で保持。例 "haishin,totsumachi"）。
     * pg配列を使わず text にすることで doin-challenge 側の移植コストを下げる。
     * 既知の値: haishin(配信) / totsumachi(凸待ち) / offkai(オフ会) /
     *           sagyo(作業通話) / utawaku(歌枠) / other
     */
    typeTags: text("typeTags").default("").notNull(),

    // --- 場所（誰が=公開 / どこに=粗い、の「粗い」側） ---
    /** "online" | "offline" */
    locationType: text("locationType").notNull(),
    /** offline 時のみ: 47都道府県（固定リスト。詐称防止のためサーバでバリデート） */
    prefecture: varchar("prefecture", { length: 32 }),
    /** offline 時の会場名（任意。unlisted は認証後のみ返す） */
    venueName: varchar("venueName", { length: 120 }),
    /** online 時の配信/通話URL（unlisted は認証後のみ返す） */
    onlineUrl: text("onlineUrl"),

    // --- 時間（予定 ⇔ ライブ ⇔ 終了） ---
    startAt: timestamp("startAt").notNull(),
    endAt: timestamp("endAt"),
    /**
     * 状態。"upcoming" | "live" | "ended" | "canceled"
     * 時刻だけでなく本人の「今やってる/終わった」操作でも遷移する（配信遅延に強い）。
     */
    status: text("status").default("upcoming").notNull(),
    /** ライブ表明した時刻（NULL=まだ表明していない） */
    liveCheckinAt: timestamp("liveCheckinAt"),

    // --- 公開範囲 ---
    /** "public"（誰でも一覧に出る） | "unlisted"（合言葉を知る人だけ） */
    visibility: text("visibility").default("public").notNull(),
    /** unlisted 時の合言葉ハッシュ（scrypt。平文は保存しない） */
    accessCodeHash: text("accessCodeHash"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("events_creatorId_idx").on(table.creatorId),
    index("events_status_startAt_idx").on(table.status, table.startAt),
    index("events_prefecture_idx").on(table.prefecture),
    check(
      "events_locationType_check",
      sql`${table.locationType} IN ('online','offline')`
    ),
    check(
      "events_status_check",
      sql`${table.status} IN ('upcoming','live','ended','canceled')`
    ),
    check(
      "events_visibility_check",
      sql`${table.visibility} IN ('public','unlisted')`
    ),
  ]
);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
