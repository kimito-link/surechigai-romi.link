/**
 * イベント一覧からブロック相手を除外することを守る。
 *
 * ★このテストが守る穴（2026-08-15 の調査で発見・報告前は誰も気づいていなかった）:
 *   modules/event/ 配下を "block" で grep してヒット0件だった。つまり
 *     - ブロックした相手の集まりが一覧に出る
 *     - ブロックした相手が自分の集まりに参加表明できる
 *   状態だった。すれ違い側(modules/encounter)は getBlockSet で除外しているのに、
 *   イベント側だけ素通しになっていた。
 *
 * 「友達を誘う」機能を足すとこの穴は悪化する（誘われたくない相手に誘いが届く）ため、
 * 先に塞ぐ。
 *
 * 判定ロジックを pure 関数に分離してここで守る（DBを叩くテスト基盤が無いため）。
 */
import { describe, expect, it } from "vitest";

import { excludeBlockedCreators } from "@/modules/event/core/block-filter";

type Row = { id: number; creatorId: number; title: string };

const rows: Row[] = [
  { id: 1, creatorId: 100, title: "普通の集まり" },
  { id: 2, creatorId: 200, title: "ブロックした人の集まり" },
  { id: 3, creatorId: 300, title: "自分が主催" },
];

describe("excludeBlockedCreators（ブロック相手の集まりを隠す）", () => {
  it("ブロックしている相手の集まりを除外する", () => {
    const result = excludeBlockedCreators(rows, new Set([200]));

    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it("ブロックが無ければ全件そのまま", () => {
    const result = excludeBlockedCreators(rows, new Set());

    expect(result).toHaveLength(3);
  });

  it("未ログイン（ブロック集合が null）なら全件そのまま", () => {
    // 公開一覧は未ログインでも見られる仕様。その場合は絞りようがない
    const result = excludeBlockedCreators(rows, null);

    expect(result).toHaveLength(3);
  });

  it("複数のブロックを同時に効かせる", () => {
    const result = excludeBlockedCreators(rows, new Set([100, 300]));

    expect(result.map((r) => r.id)).toEqual([2]);
  });

  it("元の配列を破壊しない", () => {
    excludeBlockedCreators(rows, new Set([200]));

    expect(rows).toHaveLength(3);
  });

  it("空配列でも壊れない", () => {
    expect(excludeBlockedCreators([], new Set([1]))).toEqual([]);
  });

  it("ブロックされている側からも見えない（相互に隠す）", () => {
    // getBlockSet は blocker/blocked のどちらでも拾うので、
    // 「ブロックした側」だけでなく「された側」からも相手が消える。
    // ここでは呼び出し側がそのIDを渡す前提を固定する。
    const blockedByOther = new Set([100]);

    expect(excludeBlockedCreators(rows, blockedByOther).map((r) => r.id)).toEqual([2, 3]);
  });
});
