/**
 * 都道府県クリエイター一覧の純粋ロジック単体テスト。
 * DB 非依存。kimito.link 主リンク・Twitter 非露出を重点的に検証する。
 */

import { describe, it, expect } from "vitest";
import {
  extractTwitterIdFromOpenId,
  resolveTwitterCacheForUser,
  buildPrefectureCreatorRow,
  formatCreatorAccountId,
  formatCreatorDisplayName,
  formatFollowersCount,
  resolveCreatorLinkVisibility,
} from "../modules/encounter/core/prefecture-creator.js";

const BASE_DATE = new Date("2026-06-01T12:00:00.000Z");

describe("extractTwitterIdFromOpenId", () => {
  it("twitter:123 形式から ID を抽出する", () => {
    expect(extractTwitterIdFromOpenId("twitter:987654321")).toBe("987654321");
  });

  it("Clerk 等の別形式は null", () => {
    expect(extractTwitterIdFromOpenId("user_abc")).toBeNull();
  });
});

describe("resolveTwitterCacheForUser", () => {
  const cacheByTwitterId = new Map([
    [
      "111",
      {
        twitterUsername: "from_open_id",
        twitterId: "111",
        displayName: "OpenId キャッシュ",
        profileImage: "https://example.com/a.png",
        followersCount: 100,
      },
    ],
  ]);
  const cacheByUsername = new Map([
    [
      "from_follow",
      {
        twitterUsername: "from_follow",
        twitterId: "222",
        displayName: "Follow キャッシュ",
        profileImage: null,
        followersCount: 200,
      },
    ],
    [
      "nameonly",
      {
        twitterUsername: "nameonly",
        twitterId: "333",
        displayName: "Name キャッシュ",
        profileImage: null,
        followersCount: 300,
      },
    ],
  ]);
  const followByUserId = new Map([
    [2, { twitterUsername: "from_follow", twitterId: "222" }],
  ]);

  it("openId の twitterId でキャッシュを引く", () => {
    const result = resolveTwitterCacheForUser(
      { id: 1, openId: "twitter:111", name: "表示名" },
      followByUserId,
      cacheByTwitterId,
      cacheByUsername,
    );
    expect(result?.twitterUsername).toBe("from_open_id");
  });

  it("follow の twitterUsername でキャッシュを引く", () => {
    const result = resolveTwitterCacheForUser(
      { id: 2, openId: "clerk:xyz", name: "君斗りんく@クリエイター応援" },
      followByUserId,
      cacheByTwitterId,
      cacheByUsername,
    );
    expect(result?.twitterUsername).toBe("from_follow");
  });

  it("users.name が @ なし単一トークンなら username 候補として引く", () => {
    const result = resolveTwitterCacheForUser(
      { id: 3, openId: "clerk:xyz", name: "nameonly" },
      new Map(),
      cacheByTwitterId,
      cacheByUsername,
    );
    expect(result?.twitterUsername).toBe("nameonly");
  });

  it("スペース入り displayName は username 候補にしない", () => {
    const result = resolveTwitterCacheForUser(
      { id: 4, openId: "clerk:xyz", name: "君斗りんく クリエイター" },
      new Map(),
      cacheByTwitterId,
      cacheByUsername,
    );
    expect(result).toBeUndefined();
  });
});

describe("buildPrefectureCreatorRow", () => {
  it("username があるとき kimitoLinkUrl を主リンクとして返す（X URL は含めない）", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 1,
        name: "君斗りんく@クリエイター応援",
        openId: "twitter:111",
        shareSlug: "shareAbc123",
        lastStayedAt: BASE_DATE,
      },
      { twitterUsername: "streamerfunch", twitterId: "111" },
      {
        twitterUsername: "streamerfunch",
        twitterId: "111",
        displayName: "ストリーマーファンチ",
        profileImage: "https://pbs.twimg.com/profile.jpg",
        followersCount: 12345,
      },
    );

    expect(row).not.toBeNull();
    expect(row!.kimitoLinkUrl).toBe("https://kimito.link/streamerfunch/");
    expect(row!.shareUrl).toBe("https://surechigai.kimito.link/u/shareAbc123");
    expect(row!.username).toBe("streamerfunch");
    expect(row!.displayName).toBe("ストリーマーファンチ");
    expect(row!.followersCount).toBe(12345);
    expect(JSON.stringify(row)).not.toContain("x.com");
    expect(JSON.stringify(row)).not.toContain("twitter.com");
  });

  it("Clerk 同期済み twitterUsername を優先して kimito.link を出す", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 6,
        name: "君斗りんく@クリエイター応援",
        openId: "clerk:user_abc",
        shareSlug: "validSlug12",
        lastStayedAt: BASE_DATE,
        storedTwitterUsername: "streamerfunch",
        storedTwitterId: "12345",
      },
      undefined,
      undefined,
    );
    expect(row!.username).toBe("streamerfunch");
    expect(row!.kimitoLinkUrl).toBe("https://kimito.link/streamerfunch/");
    expect(row!.displayName).toBe("君斗りんく@クリエイター応援");
  });

  it("username がなく shareSlug のみのとき kimitoLinkUrl は null、shareUrl はある", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 2,
        name: "匿名ユーザー",
        openId: "clerk:anon",
        shareSlug: "onlymap1234",
        lastStayedAt: BASE_DATE,
      },
      undefined,
      undefined,
    );

    expect(row!.kimitoLinkUrl).toBeNull();
    expect(row!.shareUrl).toBe("https://surechigai.kimito.link/u/onlymap1234");
    expect(row!.username).toBeNull();
  });

  it("無効な shareSlug は shareUrl に含めない", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 7,
        name: "test",
        openId: "clerk:x",
        shareSlug: "君斗りんく@クリエイター応援",
        lastStayedAt: BASE_DATE,
        storedTwitterUsername: "streamerfunch",
      },
      undefined,
      undefined,
    );
    expect(row!.shareSlug).toBeNull();
    expect(row!.shareUrl).toBeNull();
    expect(row!.kimitoLinkUrl).toBe("https://kimito.link/streamerfunch/");
  });

  it("username も shareSlug もないとき両リンク null", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 3,
        name: "記録のみ",
        openId: "clerk:nolink",
        shareSlug: null,
        lastStayedAt: BASE_DATE,
      },
      undefined,
      undefined,
    );

    expect(row!.kimitoLinkUrl).toBeNull();
    expect(row!.shareUrl).toBeNull();
  });

  it("lastStayedAt が無いとき null を返す", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 4,
        name: "test",
        openId: "twitter:1",
        shareSlug: null,
        lastStayedAt: null,
      },
      { twitterUsername: "testuser", twitterId: "1" },
      undefined,
    );
    expect(row).toBeNull();
  });

  it("キャッシュ username より follow username を優先しない（キャッシュ優先）", () => {
    const row = buildPrefectureCreatorRow(
      {
        userId: 5,
        name: "test",
        openId: "twitter:999",
        shareSlug: null,
        lastStayedAt: BASE_DATE,
      },
      { twitterUsername: "follow_name", twitterId: "999" },
      {
        twitterUsername: "cache_name",
        twitterId: "999",
        displayName: null,
        profileImage: null,
        followersCount: null,
      },
    );
    expect(row!.username).toBe("cache_name");
    expect(row!.kimitoLinkUrl).toBe("https://kimito.link/cache_name/");
  });
});

describe("表示用フォーマット", () => {
  it("formatCreatorAccountId は @ を付与する", () => {
    expect(formatCreatorAccountId("streamerfunch")).toBe("@streamerfunch");
    expect(formatCreatorAccountId("@streamerfunch")).toBe("@streamerfunch");
    expect(formatCreatorAccountId(null)).toBe("—");
  });

  it("formatCreatorDisplayName は displayName → username → 名無し", () => {
    expect(formatCreatorDisplayName("表示名", "user")).toBe("表示名");
    expect(formatCreatorDisplayName(null, "user")).toBe("user");
    expect(formatCreatorDisplayName(null, null)).toBe("名無し");
  });

  it("formatFollowersCount は ja-JP 区切り、無効値は em dash", () => {
    expect(formatFollowersCount(12345)).toBe("12,345");
    expect(formatFollowersCount(null)).toBe("—");
    expect(formatFollowersCount(undefined)).toBe("—");
  });
});

describe("resolveCreatorLinkVisibility", () => {
  it("kimito と share の両方を表示", () => {
    const v = resolveCreatorLinkVisibility({
      username: "streamerfunch",
      kimitoLinkUrl: "https://kimito.link/streamerfunch/",
      shareSlug: "abc",
      shareUrl: "https://surechigai.kimito.link/u/abc",
    });
    expect(v.showKimitoLink).toBe(true);
    expect(v.showShareMap).toBe(true);
    expect(v.kimitoLabel).toBe("kimito.link/streamerfunch/");
  });

  it("username なしでは kimito 非表示、share のみ", () => {
    const v = resolveCreatorLinkVisibility({
      username: null,
      kimitoLinkUrl: null,
      shareSlug: "abc",
      shareUrl: "https://surechigai.kimito.link/u/abc",
    });
    expect(v.showKimitoLink).toBe(false);
    expect(v.showShareMap).toBe(true);
  });

  it("無効 shareSlug では現在地ボタンを出さない", () => {
    const v = resolveCreatorLinkVisibility({
      username: "streamerfunch",
      kimitoLinkUrl: "https://kimito.link/streamerfunch/",
      shareSlug: "invalid slug!",
      shareUrl: null,
    });
    expect(v.showKimitoLink).toBe(true);
    expect(v.showShareMap).toBe(false);
  });
});
