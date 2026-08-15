/**
 * 未開封サマリの計算が「10分に1回」に間引かれることを守る。
 *
 * なぜ間引くのか（2026-08-15 の設計判断）:
 * presence.pulse は居場所ONのユーザーから60秒ごとに飛んでくる。
 * ここに未開封サマリのDBクエリを無条件で足すと、レーダーONの人数だけ
 * 毎分クエリが増える。ユーザーの許容遅延は「数十分〜数時間後でよい」なので、
 * 10分に1回で要件を十分に満たしつつ負荷を1/10にする。
 *
 * ★過去に presence 系で 429 の嵐（毎APIコールでトークン再取得 → 雪だるま）を
 *   起こした前科があるため、pulse に何かを足すときは必ず間引きを伴わせる。
 */
import { describe, expect, it } from "vitest";

import { shouldComputeUnopenedSummary } from "@/modules/encounter/api/presence";

/** テスト間で userId が衝突しないように毎回ずらす（Map はモジュールスコープで永続） */
let nextUserId = 1000;
const freshUserId = () => ++nextUserId;

describe("shouldComputeUnopenedSummary（未開封サマリの間引き）", () => {
  it("初回は計算する", () => {
    expect(shouldComputeUnopenedSummary(freshUserId(), 1_000_000)).toBe(true);
  });

  it("10分未満の2回目は計算しない（pulse 毎にDBを引かない）", () => {
    const userId = freshUserId();
    const now = 1_000_000;

    expect(shouldComputeUnopenedSummary(userId, now)).toBe(true);
    // 60秒後 = 次の pulse
    expect(shouldComputeUnopenedSummary(userId, now + 60_000)).toBe(false);
    // 9分後もまだ
    expect(shouldComputeUnopenedSummary(userId, now + 9 * 60_000)).toBe(false);
  });

  it("10分経過後は再び計算する", () => {
    const userId = freshUserId();
    const now = 2_000_000;

    expect(shouldComputeUnopenedSummary(userId, now)).toBe(true);
    expect(shouldComputeUnopenedSummary(userId, now + 10 * 60_000 + 1)).toBe(true);
  });

  it("ユーザーごとに独立して判定する（他人の pulse に引きずられない）", () => {
    const userA = freshUserId();
    const userB = freshUserId();
    const now = 3_000_000;

    expect(shouldComputeUnopenedSummary(userA, now)).toBe(true);
    // 直後でも別ユーザーなら計算してよい
    expect(shouldComputeUnopenedSummary(userB, now)).toBe(true);
    // A はまだ間引かれたまま
    expect(shouldComputeUnopenedSummary(userA, now + 1000)).toBe(false);
  });
});
