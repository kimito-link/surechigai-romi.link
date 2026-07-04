/**
 * __tests__/get-my-encounters-contract.test.ts
 *
 * modules/encounter/db/queries.ts の getMyEncounters 返却契約テスト。
 * refactor-instructions.md 確定事項4: N+1最適化の前に、モックDBで
 * 返却順・件数・cursor・ブロック除外・停止ユーザー除外・24hひとこと表示を固定する。
 *
 * 実DB非依存。drizzle のテーブルオブジェクトをテーブル名で識別し、
 * テーブルごとに用意したキューから呼び出し順にレスポンスを返す
 * 最小限のモックビルダーを使う。
 *
 * バッチ化後のクエリ発行順（キューの並び順はこれに対応する）:
 *   1. blocks        — ブロックセット
 *   2. encounters #1 — すれ違い一覧（最大20件）
 *   3. users #1      — パートナー情報の inArray 一括取得
 *   4. twitter_user_cache #1 — Twitterキャッシュの inArray 一括取得（username 候補がある場合のみ）
 *   5. encounters #2 — 累計すれ違い数 userA側 GROUP BY
 *   6. encounters #3 — 累計すれ違い数 userB側 GROUP BY（#2 と合算される）
 * パートナーIDが空（全員ブロック等）の場合は 3 以降は発行されない。
 */
import { describe, it, expect } from "vitest";
import { getMyEncounters } from "../modules/encounter/db/queries.js";

// ---------------------------------------------------------------------------
// モックDBビルダー
// ---------------------------------------------------------------------------

const DRIZZLE_NAME = Symbol.for("drizzle:Name");

function tableName(table: unknown): string {
  const name = (table as Record<symbol, unknown>)[DRIZZLE_NAME];
  if (typeof name === "string") return name;
  throw new Error("Unknown table object passed to mock db");
}

/**
 * テーブル名ごとに呼び出し順で消費されるレスポンスキュー。
 * 各キューのエントリは「そのテーブルへの select が何回目に呼ばれたときに何を返すか」を表す。
 */
type QueueMap = Record<string, unknown[][]>;

function createMockDb(queues: QueueMap) {
  const callIndex: Record<string, number> = {};

  function nextResult(table: string): unknown[] {
    const idx = callIndex[table] ?? 0;
    callIndex[table] = idx + 1;
    const queue = queues[table] ?? [];
    return queue[idx] ?? [];
  }

  function makeChain(table: string) {
    // Drizzle のチェーンはメソッドを何回呼んでも最終的に awaitable。
    // where/orderBy/limit のどこで await されても同じ結果を返すよう、
    // thenable なオブジェクトとして各メソッドを実装する。
    const rows = nextResult(table);
    const chain: Record<string, unknown> = {
      where: () => chain,
      orderBy: () => chain,
      limit: () => chain,
      groupBy: () => chain,
      innerJoin: () => chain,
      then: (resolve: (v: unknown[]) => void) => resolve(rows),
    };
    return chain;
  }

  return {
    select: (_cols: unknown) => ({
      from: (table: unknown) => makeChain(tableName(table)),
    }),
  };
}

// ---------------------------------------------------------------------------
// フィクスチャ
// ---------------------------------------------------------------------------

const BASE_ENCOUNTER_ROW = {
  id: 1,
  userAId: 100,
  userBId: 200,
  tier: 1,
  h3R7: "h3r7-a",
  areaName: "渋谷区",
  prefecture: "東京都",
  occurredAt: new Date("2026-07-04T10:00:00Z"),
  openedByA: null,
  openedByB: null,
};

const BASE_PARTNER = {
  id: 200,
  name: "partner_user",
  hitokoto: "こんにちは",
  hitokotoUpdatedAt: new Date("2026-07-04T09:00:00Z"),
  isSuspended: false,
};

describe("getMyEncounters — 返却契約", () => {
  const selfUserId = 100;

  it("正常系: encounter 1件をそのまま返す（件数・フィールド・累計はA側+B側の合算）", async () => {
    const db = createMockDb({
      blocks: [[]], // ブロックなし
      encounters: [
        [BASE_ENCOUNTER_ROW], // メイン一覧クエリ
        [{ partnerId: 200, cnt: 3 }], // 累計 userA側
        [{ partnerId: 200, cnt: 2 }], // 累計 userB側 → 合算で5
      ],
      users: [[BASE_PARTNER]],
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 1,
      partnerId: 200, // userAId===self なので相手は userBId
      partnerName: "partner_user",
      tier: 1,
      h3R7: "h3r7-a",
      areaName: "渋谷区",
      prefecture: "東京都",
      partnerTotalEncounters: 5,
    });
  });

  it("返却順: DBが返した順序をそのまま維持する（呼び出し側でDESC済み前提）", async () => {
    const rowA = { ...BASE_ENCOUNTER_ROW, id: 1, occurredAt: new Date("2026-07-04T10:00:00Z") };
    const rowB = { ...BASE_ENCOUNTER_ROW, id: 2, occurredAt: new Date("2026-07-03T10:00:00Z") };

    const db = createMockDb({
      blocks: [[]],
      encounters: [
        [rowA, rowB], // クエリ結果順（新しい方が先）
        [{ partnerId: 200, cnt: 1 }],
        [],
      ],
      users: [[BASE_PARTNER]],
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId);

    expect(items.map((i) => i.id)).toEqual([1, 2]);
  });

  it("件数: limit=20 を超える行があっても、DBが返した行数分だけ返す（ページングはDB側の責務）", async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      ...BASE_ENCOUNTER_ROW,
      id: i + 1,
      occurredAt: new Date(Date.now() - i * 1000),
    }));

    const db = createMockDb({
      blocks: [[]],
      encounters: [
        rows,
        [{ partnerId: 200, cnt: 1 }],
        [],
      ],
      users: [[BASE_PARTNER]],
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(20);
  });

  it("cursor: 明示的に渡した cursor がそのまま使われても契約上は正常応答する", async () => {
    const db = createMockDb({
      blocks: [[]],
      encounters: [
        [BASE_ENCOUNTER_ROW],
        [{ partnerId: 200, cnt: 1 }],
        [],
      ],
      users: [[BASE_PARTNER]],
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId, "2026-07-04T12:00:00.000Z");
    expect(items).toHaveLength(1);
  });

  it("ブロック除外: パートナーがブロック関係にある場合は結果から除外される", async () => {
    // selfUserId(100) が userBId(200) をブロックしている
    const db = createMockDb({
      blocks: [[{ blockerId: 100, blockedId: 200 }]],
      encounters: [[BASE_ENCOUNTER_ROW]], // メインクエリのみ（ブロックで弾かれるため後続クエリは呼ばれない）
      users: [],
      twitter_user_cache: [],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(0);
  });

  it("ブロック除外: 相手からブロックされている場合も除外される", async () => {
    // userBId(200) が selfUserId(100) をブロックしている
    const db = createMockDb({
      blocks: [[{ blockerId: 200, blockedId: 100 }]],
      encounters: [[BASE_ENCOUNTER_ROW]],
      users: [],
      twitter_user_cache: [],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(0);
  });

  it("停止ユーザー除外: partner.isSuspended が true の場合は除外される", async () => {
    const db = createMockDb({
      blocks: [[]],
      encounters: [[BASE_ENCOUNTER_ROW]], // 停止のみ→キャッシュ・累計クエリは呼ばれない
      users: [[{ ...BASE_PARTNER, isSuspended: true }]],
      twitter_user_cache: [],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(0);
  });

  it("パートナーのユーザー行が見つからない場合は除外される", async () => {
    const db = createMockDb({
      blocks: [[]],
      encounters: [[BASE_ENCOUNTER_ROW]],
      users: [[]], // パートナー行なし
      twitter_user_cache: [],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(0);
  });

  it("24hひとこと表示: partnerHitokotoUpdatedAt は生の値のまま返す（24h判定はルーター側の責務）", async () => {
    // getMyEncounters 自体は hitokotoUpdatedAt を素通しするだけで、
    // 24h以内フィルタは modules/encounter/api/encounter.ts の list プロシージャが行う。
    const oldHitokoto = {
      ...BASE_PARTNER,
      hitokotoUpdatedAt: new Date("2020-01-01T00:00:00Z"), // 24h以上前
    };
    const db = createMockDb({
      blocks: [[]],
      encounters: [
        [BASE_ENCOUNTER_ROW],
        [{ partnerId: 200, cnt: 1 }],
        [],
      ],
      users: [[oldHitokoto]],
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(1);
    // getMyEncounters は生の hitokoto を返す（フィルタしない）契約を固定する
    expect(items[0].partnerHitokoto).toBe(oldHitokoto.hitokoto);
    expect(items[0].partnerHitokotoUpdatedAt).toEqual(oldHitokoto.hitokotoUpdatedAt);
  });

  it("Twitterキャッシュがある場合、partnerDisplayName/partnerProfileImage/partnerFollowersCount はキャッシュ優先", async () => {
    // 実DBでは twitterUsername = username候補 の行しかヒットしないため、
    // fixture の twitterUsername は候補（partner.name から導出される "partner_user"）と一致させる。
    const db = createMockDb({
      blocks: [[]],
      encounters: [
        [BASE_ENCOUNTER_ROW],
        [{ partnerId: 200, cnt: 1 }],
        [],
      ],
      users: [[BASE_PARTNER]],
      twitter_user_cache: [
        [
          {
            twitterUsername: "partner_user",
            displayName: "キャッシュ表示名",
            profileImage: "https://example.com/avatar.png",
            followersCount: 42,
          },
        ],
      ],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items[0].partnerUsername).toBe("partner_user");
    expect(items[0].partnerDisplayName).toBe("キャッシュ表示名");
    expect(items[0].partnerProfileImage).toBe("https://example.com/avatar.png");
    expect(items[0].partnerFollowersCount).toBe(42);
  });

  it("partnerId: 自分が userBId のときは userAId が相手になる", async () => {
    const row = { ...BASE_ENCOUNTER_ROW, userAId: 300, userBId: 100 };
    const db = createMockDb({
      blocks: [[]],
      encounters: [[row], [], []], // 累計はGROUP BY行なし→0
      users: [[{ ...BASE_PARTNER, id: 300 }]],
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items[0].partnerId).toBe(300);
    expect(items[0].partnerTotalEncounters).toBe(0);
  });

  it("結果が空の場合は空配列を返す", async () => {
    const db = createMockDb({
      blocks: [[]],
      encounters: [[]],
      users: [],
      twitter_user_cache: [],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toEqual([]);
  });

  it("バッチ整合: 複数パートナー混在時も各行に正しいパートナー情報・キャッシュ・累計が対応する", async () => {
    const row1 = { ...BASE_ENCOUNTER_ROW, id: 1, userAId: 100, userBId: 200 };
    const row2 = { ...BASE_ENCOUNTER_ROW, id: 2, userAId: 300, userBId: 100 };
    const partnerA = { ...BASE_PARTNER, id: 200, name: "user_a", hitokoto: "Aのひとこと" };
    const partnerB = { ...BASE_PARTNER, id: 300, name: "user_b", hitokoto: "Bのひとこと" };

    const db = createMockDb({
      blocks: [[]],
      encounters: [
        [row1, row2],
        [{ partnerId: 200, cnt: 2 }], // userA側: 200→2
        [
          { partnerId: 300, cnt: 4 }, // userB側: 300→4
          { partnerId: 200, cnt: 1 }, // userB側: 200→1（合算で3）
        ],
      ],
      users: [[partnerA, partnerB]], // 一括取得（1回のクエリで両方返る）
      twitter_user_cache: [
        [
          {
            twitterUsername: "user_a",
            displayName: "Aさんの表示名",
            profileImage: "https://example.com/a.png",
            followersCount: 10,
          },
          // user_b はキャッシュなし
        ],
      ],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(2);

    expect(items[0]).toMatchObject({
      id: 1,
      partnerId: 200,
      partnerName: "user_a",
      partnerHitokoto: "Aのひとこと",
      partnerDisplayName: "Aさんの表示名",
      partnerProfileImage: "https://example.com/a.png",
      partnerFollowersCount: 10,
      partnerTotalEncounters: 3,
    });
    expect(items[1]).toMatchObject({
      id: 2,
      partnerId: 300,
      partnerName: "user_b",
      partnerHitokoto: "Bのひとこと",
      partnerDisplayName: "user_b", // キャッシュなし→users.name
      partnerProfileImage: null,
      partnerFollowersCount: null,
      partnerTotalEncounters: 4,
    });
  });

  it("バッチ整合: ブロック相手と通常相手が混在する場合、ブロック相手の行だけ除外される", async () => {
    const rowBlocked = { ...BASE_ENCOUNTER_ROW, id: 1, userAId: 100, userBId: 200 };
    const rowNormal = { ...BASE_ENCOUNTER_ROW, id: 2, userAId: 100, userBId: 300 };

    const db = createMockDb({
      blocks: [[{ blockerId: 100, blockedId: 200 }]], // 200 のみブロック
      encounters: [
        [rowBlocked, rowNormal],
        [{ partnerId: 300, cnt: 1 }],
        [],
      ],
      users: [[{ ...BASE_PARTNER, id: 300, name: "user_b" }]], // バッチ対象は 300 のみ
      twitter_user_cache: [[]],
    });

    const items = await getMyEncounters(db as never, selfUserId);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(2);
    expect(items[0].partnerId).toBe(300);
  });
});
