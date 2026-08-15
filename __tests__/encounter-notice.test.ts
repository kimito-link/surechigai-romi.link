/**
 * すれちがい通知の「鳴らす／鳴らさない」判定を守る。
 *
 * 背景（2026-08-15 ユーザー報告「通知機能がまったくない」）:
 * encounters は相手のチェックイン時に生まれるが、本人に知らせる経路が無く、
 * 封筒タブを自発的に開いた人だけが気づく状態だった。
 *
 * ★電池を消耗しない要件（ユーザー明示）を満たすため、新しい位置取得も
 *   新しいポーリングも作らない。既に60秒ごとに飛んでいる presence.pulse の
 *   応答に未開封サマリを相乗りさせ、その判定だけをここで守る。
 *
 * ここで固定するのは「同じすれ違いで何度も鳴らないこと」。
 * pulse は60秒ごとに来るので、件数だけで判定すると毎分鳴ってしまう。
 * latestId（単調増加）が前回通知時より進んだときだけ鳴らす。
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

/** AsyncStorage のインメモリ実装（キーごとの値を保持する） */
const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: async (k: string) => {
      store.delete(k);
    },
  },
}));

const { consumeNotifiableSummary, readNoticeEnabled, writeNoticeEnabled } =
  await import("@/lib/encounter-notice");

beforeEach(() => {
  store.clear();
});

describe("consumeNotifiableSummary（鳴らすかどうか）", () => {
  it("初回の未開封は鳴る", async () => {
    const result = await consumeNotifiableSummary({ count: 2, latestId: 10 });

    expect(result).toEqual({ count: 2, latestId: 10 });
  });

  it("同じ latestId の2回目は鳴らない（60秒ごとに鳴り続けない）", async () => {
    await consumeNotifiableSummary({ count: 2, latestId: 10 });
    const second = await consumeNotifiableSummary({ count: 2, latestId: 10 });

    expect(second).toBeNull();
  });

  it("新しいすれ違いが来て latestId が進んだら再び鳴る", async () => {
    await consumeNotifiableSummary({ count: 2, latestId: 10 });
    const next = await consumeNotifiableSummary({ count: 3, latestId: 11 });

    expect(next).toEqual({ count: 3, latestId: 11 });
  });

  it("count が 0 なら latestId が進んでいても鳴らない", async () => {
    const result = await consumeNotifiableSummary({ count: 0, latestId: 99 });

    expect(result).toBeNull();
  });

  it("開封して件数が減っただけでは鳴らない（latestId が進んでいないため）", async () => {
    await consumeNotifiableSummary({ count: 3, latestId: 20 });
    const afterOpening = await consumeNotifiableSummary({ count: 1, latestId: 20 });

    expect(afterOpening).toBeNull();
  });

  it("OFF なら鳴らず、かつ lastNotifiedId を進めない（ON に戻したら鳴る）", async () => {
    await writeNoticeEnabled(false);

    expect(await consumeNotifiableSummary({ count: 2, latestId: 30 })).toBeNull();

    await writeNoticeEnabled(true);
    // OFF 中に握り潰した分が、ON に戻したときに鳴らないと取りこぼしになる
    expect(await consumeNotifiableSummary({ count: 2, latestId: 30 })).toEqual({
      count: 2,
      latestId: 30,
    });
  });

  it("古い latestId が来ても鳴らない（順序が前後しても退行しない）", async () => {
    await consumeNotifiableSummary({ count: 5, latestId: 50 });
    const stale = await consumeNotifiableSummary({ count: 5, latestId: 49 });

    expect(stale).toBeNull();
  });
});

describe("通知のON/OFF設定", () => {
  it("未保存なら既定で ON", async () => {
    expect(await readNoticeEnabled()).toBe(true);
  });

  it("OFF にしたら読み出しも OFF", async () => {
    await writeNoticeEnabled(false);

    expect(await readNoticeEnabled()).toBe(false);
  });

  it("ストレージが壊れていても既定 ON にフォールバックする", async () => {
    store.set("surechigai.encounterNotice.enabled.v1", "not-a-boolean");

    expect(await readNoticeEnabled()).toBe(true);
  });
});
