/**
 * @vitest-environment jsdom
 *
 * ★jsdom を明示する理由:
 *   重複送信の抑止は localStorage に前回値を控える実装。既定の node 環境では
 *   localStorage が存在せず、抑止が常に no-op になって**テストが通ってしまう**
 *   （実装が壊れていても気づけない）。ブラウザで動く機能はブラウザ相当で測る。
 *   vitest.config.ts の environmentMatchGlobs は components/ と hooks/ だけが対象で、
 *   __tests__/ は node のままなのでここで個別に指定する。
 *
 * kimito.link ハブへの利用サマリ送信が「壊さない・嘘をつかない」ことを守る。
 *
 * このテストが守る事故（2026-09-23 に受け口の実装を読んで特定）:
 *
 *   kimito.link 側 lib/hub-metadata.ts:151 は
 *     const sanitized = sanitizeHubAppSummary(summary) ?? {};
 *     apps[appName] = sanitized;
 *   となっており、**送った項目が全部濾されると既存サマリが空 {} で上書き消去され、
 *   しかも {ok:true} が返る**。＝ 200 を見ても「保存された」とは限らない。
 *
 *   受け口が黙って捨てる値（実装で確認済み）:
 *     count : 数値以外・負値・非有限     → キーごと消える
 *     label : 1〜40文字外・半角スペース含 → キーごと消える
 *     ISO   : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ に前方一致しない → 消える
 *
 * ここで固定するのは4点:
 *   1. ★測れていない値を 0 で埋めて送らない（「0人」と「測れなかった」を混同しない）
 *   2. ★受け口に捨てられる値を送らない（送ると既存が消える）
 *   3. 未ログインでは通信を1回も発行しない
 *   4. ★何が起きても例外を外に出さない（チェックインを巻き添えにしない）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendHubSummary } = await import("@/lib/kimito-link-urls");

const originalFetch = globalThis.fetch;
const HUB_URL = "https://kimito.link/api/hub/summary";

/** localStorage を毎回まっさらにする（重複送信の抑止が前のテストに引きずられないように）。 */
function resetStorage() {
  try {
    localStorage.clear();
  } catch {
    // jsdom 以外の環境では localStorage が無い。その場合は何もしない。
  }
}

const token = async () => "clerk-session-token";
const noToken = async () => null;

beforeEach(() => {
  resetStorage();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("sendHubSummary（正常系）", () => {
  it("確定値が揃っていれば Bearer で POST する", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, app: "surechigai" }), { status: 200 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      {
        encounterPartnerCount: 12,
        visitedPrefectureCount: 3,
        latestRecordedAt: new Date("2026-09-23T10:00:00.000Z"),
      },
      token,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(HUB_URL);
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer clerk-session-token");

    // ★Cookie を送らない（受け口は credentials を許可していない）。
    expect(init.credentials).toBeUndefined();

    const body = JSON.parse(String(init.body));
    expect(body.appKey).toBe("surechigai");
    expect(body.summary).toMatchObject({
      count: 12,
      label: "すれ違い",
      count2: 3,
      label2: "都道府県",
    });
    // ISO は受け口の正規表現に前方一致する形であること。
    expect(body.summary.lastActiveAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });

  it("小数は切り捨てて送る（受け口の Math.floor と食い違わせない）", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: 12.9, visitedPrefectureCount: 3.2, latestRecordedAt: null },
      token,
    );

    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.summary.count).toBe(12);
    expect(body.summary.count2).toBe(3);
  });

  it("ISO として通らない時刻は載せない（載せても捨てられるだけ）", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: 1, visitedPrefectureCount: 1, latestRecordedAt: "きのう" },
      token,
    );

    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.summary.lastActiveAt).toBeUndefined();
    // ★それ以外は送られる（時刻が無いことを理由に全部やめない）。
    expect(body.summary.count).toBe(1);
  });
});

describe("★測れていない値を 0 で埋めない", () => {
  it("すれ違い人数が undefined なら送信しない", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: undefined, visitedPrefectureCount: 3, latestRecordedAt: null },
      token,
    );

    // ★0 を送ると「測れなかった」が「0人」として記録され二度と区別できない。
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("都道府県数が undefined なら送信しない", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: 12, visitedPrefectureCount: undefined, latestRecordedAt: null },
      token,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("★本当に 0 人のときは送る（undefined と 0 を取り違えない）", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: 0, visitedPrefectureCount: 0, latestRecordedAt: null },
      token,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.summary.count).toBe(0);
  });
});

describe("★受け口に捨てられる値を送らない（既存サマリを消さないため）", () => {
  it("負値は送信しない", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: -1, visitedPrefectureCount: 3, latestRecordedAt: null },
      token,
    );

    // 受け口は負値をキーごと捨てる。全滅すると既存サマリが空で上書きされる。
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("NaN / Infinity は送信しない", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: Number.NaN, visitedPrefectureCount: 3, latestRecordedAt: null },
      token,
    );
    await sendHubSummary(
      { encounterPartnerCount: 1, visitedPrefectureCount: Number.POSITIVE_INFINITY, latestRecordedAt: null },
      token,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("未ログイン・重複・失敗の扱い", () => {
  it("★未ログインなら通信を1回も発行しない", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: 12, visitedPrefectureCount: 3, latestRecordedAt: null },
      noToken,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("同じ内容を続けて送らない（受け口は毎回 Clerk API を2回叩くため）", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const input = {
      encounterPartnerCount: 12,
      visitedPrefectureCount: 3,
      latestRecordedAt: new Date("2026-09-23T10:00:00.000Z"),
    };
    await sendHubSummary(input, token);
    await sendHubSummary(input, token);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("値が変われば送る", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendHubSummary(
      { encounterPartnerCount: 12, visitedPrefectureCount: 3, latestRecordedAt: null },
      token,
    );
    await sendHubSummary(
      { encounterPartnerCount: 13, visitedPrefectureCount: 3, latestRecordedAt: null },
      token,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("★失敗しても例外を外に出さない（チェックインを巻き添えにしない）", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    await expect(
      sendHubSummary(
        { encounterPartnerCount: 12, visitedPrefectureCount: 3, latestRecordedAt: null },
        token,
      ),
    ).resolves.toBeUndefined();
  });

  it("★トークン取得が throw しても例外を外に出さない", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;

    await expect(
      sendHubSummary(
        { encounterPartnerCount: 12, visitedPrefectureCount: 3, latestRecordedAt: null },
        async () => {
          throw new Error("clerk rate limited");
        },
      ),
    ).resolves.toBeUndefined();
  });

  it("★失敗したら記録しない（次回また送れる）", async () => {
    const failing = vi.fn(async () => new Response("{}", { status: 500 }));
    globalThis.fetch = failing as unknown as typeof fetch;

    const input = {
      encounterPartnerCount: 12,
      visitedPrefectureCount: 3,
      latestRecordedAt: null,
    };
    await sendHubSummary(input, token);
    await sendHubSummary(input, token);

    // 500 のときは前回送信として記録しないので、2回目も試される。
    expect(failing).toHaveBeenCalledTimes(2);
  });
});
