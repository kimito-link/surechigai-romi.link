/**
 * useRankingData フックのユニットテスト
 * 
 * テスト対象:
 * - 参加者のソートとランク付け
 * - 総貢献数の計算
 * - 平均貢献数の計算
 * - 表示制限の処理
 * - トップ3データの取得
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRankingData, useTopThreeData } from "../useRankingData";
import type { Participant } from "../types";

// テスト用のモックデータを生成するヘルパー関数
function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 1,
    userId: 1,
    displayName: "テストユーザー",
    username: "testuser",
    profileImage: null,
    contribution: 10,
    companionCount: 0,
    message: null,
    isAnonymous: false,
    createdAt: new Date(),
    gender: null,
    ...overrides,
  };
}

describe("useRankingData", () => {
  describe("空のデータ", () => {
    it("空の配列を渡した場合、全ての値が0または空になる", () => {
      const { result } = renderHook(() => useRankingData([], 10));

      expect(result.current.rankedParticipants).toHaveLength(0);
      expect(result.current.totalContribution).toBe(0);
      expect(result.current.avgContribution).toBe("0");
      expect(result.current.hasMoreParticipants).toBe(false);
      expect(result.current.remainingCount).toBe(-10);
    });
  });

  describe("参加者のソートとランク付け", () => {
    it("貢献数の降順でソートされる", () => {
      const participants = [
        createMockParticipant({ id: 1, displayName: "A", contribution: 10 }),
        createMockParticipant({ id: 2, displayName: "B", contribution: 30 }),
        createMockParticipant({ id: 3, displayName: "C", contribution: 20 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      expect(result.current.rankedParticipants[0].displayName).toBe("B");
      expect(result.current.rankedParticipants[1].displayName).toBe("C");
      expect(result.current.rankedParticipants[2].displayName).toBe("A");
    });

    it("正しいランクが付与される", () => {
      const participants = [
        createMockParticipant({ id: 1, contribution: 10 }),
        createMockParticipant({ id: 2, contribution: 30 }),
        createMockParticipant({ id: 3, contribution: 20 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      expect(result.current.rankedParticipants[0].rank).toBe(1);
      expect(result.current.rankedParticipants[1].rank).toBe(2);
      expect(result.current.rankedParticipants[2].rank).toBe(3);
    });

    it("同じ貢献数の場合、元の順序が維持される（安定ソート）", () => {
      const participants = [
        createMockParticipant({ id: 1, displayName: "A", contribution: 20 }),
        createMockParticipant({ id: 2, displayName: "B", contribution: 20 }),
        createMockParticipant({ id: 3, displayName: "C", contribution: 20 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      // 安定ソートなので元の順序が維持される
      expect(result.current.rankedParticipants[0].displayName).toBe("A");
      expect(result.current.rankedParticipants[1].displayName).toBe("B");
      expect(result.current.rankedParticipants[2].displayName).toBe("C");
    });
  });

  describe("総貢献数の計算", () => {
    it("全参加者の貢献数を正しく合計する", () => {
      const participants = [
        createMockParticipant({ contribution: 10 }),
        createMockParticipant({ contribution: 20 }),
        createMockParticipant({ contribution: 30 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      expect(result.current.totalContribution).toBe(60);
    });

    it("1人の場合も正しく計算する", () => {
      const participants = [
        createMockParticipant({ contribution: 42 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      expect(result.current.totalContribution).toBe(42);
    });
  });

  describe("平均貢献数の計算", () => {
    it("平均値を小数点1桁で返す", () => {
      const participants = [
        createMockParticipant({ contribution: 10 }),
        createMockParticipant({ contribution: 20 }),
        createMockParticipant({ contribution: 30 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      expect(result.current.avgContribution).toBe("20.0");
    });

    it("割り切れない場合も小数点1桁で返す", () => {
      const participants = [
        createMockParticipant({ contribution: 10 }),
        createMockParticipant({ contribution: 11 }),
        createMockParticipant({ contribution: 12 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 10));

      expect(result.current.avgContribution).toBe("11.0");
    });
  });

  describe("表示制限の処理", () => {
    it("maxDisplayより多い参加者がいる場合、hasMoreParticipantsがtrueになる", () => {
      const participants = [
        createMockParticipant({ id: 1 }),
        createMockParticipant({ id: 2 }),
        createMockParticipant({ id: 3 }),
        createMockParticipant({ id: 4 }),
        createMockParticipant({ id: 5 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 3));

      expect(result.current.hasMoreParticipants).toBe(true);
      expect(result.current.remainingCount).toBe(2);
    });

    it("maxDisplay以下の参加者の場合、hasMoreParticipantsがfalseになる", () => {
      const participants = [
        createMockParticipant({ id: 1 }),
        createMockParticipant({ id: 2 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 3));

      expect(result.current.hasMoreParticipants).toBe(false);
      expect(result.current.remainingCount).toBe(-1);
    });

    it("rankedParticipantsはmaxDisplayまでに制限される", () => {
      const participants = [
        createMockParticipant({ id: 1 }),
        createMockParticipant({ id: 2 }),
        createMockParticipant({ id: 3 }),
        createMockParticipant({ id: 4 }),
        createMockParticipant({ id: 5 }),
      ];
      const { result } = renderHook(() => useRankingData(participants, 3));

      expect(result.current.rankedParticipants).toHaveLength(3);
    });
  });

  describe("データの再計算", () => {
    it("入力データが変更されると結果も更新される", () => {
      const initialParticipants = [
        createMockParticipant({ contribution: 10 }),
      ];
      const { result, rerender } = renderHook(
        ({ participants, maxDisplay }: { participants: Participant[]; maxDisplay: number }) => 
          useRankingData(participants, maxDisplay),
        { initialProps: { participants: initialParticipants, maxDisplay: 10 } }
      );

      expect(result.current.totalContribution).toBe(10);

      const updatedParticipants = [
        createMockParticipant({ contribution: 50 }),
      ];
      rerender({ participants: updatedParticipants, maxDisplay: 10 });

      expect(result.current.totalContribution).toBe(50);
    });
  });
});

describe("useTopThreeData", () => {
  it("トップ3の参加者を返す", () => {
    const participants = [
      createMockParticipant({ id: 1, displayName: "A", contribution: 10 }),
      createMockParticipant({ id: 2, displayName: "B", contribution: 30 }),
      createMockParticipant({ id: 3, displayName: "C", contribution: 20 }),
      createMockParticipant({ id: 4, displayName: "D", contribution: 40 }),
      createMockParticipant({ id: 5, displayName: "E", contribution: 5 }),
    ];
    const { result } = renderHook(() => useTopThreeData(participants));

    expect(result.current).toHaveLength(3);
    expect(result.current[0].displayName).toBe("D");
    expect(result.current[1].displayName).toBe("B");
    expect(result.current[2].displayName).toBe("C");
  });

  it("3人未満の場合、全員を返す", () => {
    const participants = [
      createMockParticipant({ id: 1, displayName: "A", contribution: 10 }),
      createMockParticipant({ id: 2, displayName: "B", contribution: 30 }),
    ];
    const { result } = renderHook(() => useTopThreeData(participants));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].displayName).toBe("B");
    expect(result.current[1].displayName).toBe("A");
  });

  it("空の配列の場合、空の配列を返す", () => {
    const { result } = renderHook(() => useTopThreeData([]));

    expect(result.current).toHaveLength(0);
  });
});
