/**
 * useHeatmapData フックのユニットテスト
 * 
 * テスト対象:
 * - 都道府県ごとの参加者数集計
 * - 最大参加者数の計算
 * - 総参加者数の計算
 * - 地域ごとの参加者数集計
 * - 最も参加者が多い都道府県の特定
 * - 参加者がいる都道府県の数
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHeatmapData } from "../useHeatmapData";

describe("useHeatmapData", () => {
  describe("空のデータ", () => {
    it("空のオブジェクトを渡した場合、全ての値が0または空になる", () => {
      const { result } = renderHook(() => useHeatmapData({}));

      expect(result.current.totalCount).toBe(0);
      expect(result.current.maxPrefectureCount).toBe(0);
      expect(result.current.maxRegionCount).toBe(1); // 最小値は1
      expect(result.current.activePrefectureCount).toBe(0);
      expect(result.current.hotPrefecture.count).toBe(0);
    });
  });

  describe("総参加者数の計算", () => {
    it("複数の都道府県の参加者数を正しく合計する", () => {
      const prefectureCounts = {
        "東京都": 100,
        "大阪府": 50,
        "北海道": 30,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.totalCount).toBe(180);
    });

    it("1つの都道府県のみの場合も正しく計算する", () => {
      const prefectureCounts = {
        "東京都": 42,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.totalCount).toBe(42);
    });
  });

  describe("最大参加者数の計算", () => {
    it("最も参加者が多い都道府県の数を返す", () => {
      const prefectureCounts = {
        "東京都": 100,
        "大阪府": 50,
        "北海道": 30,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.maxPrefectureCount).toBe(100);
    });

    it("全て同じ参加者数の場合、その数を返す", () => {
      const prefectureCounts = {
        "東京都": 25,
        "大阪府": 25,
        "北海道": 25,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.maxPrefectureCount).toBe(25);
    });
  });

  describe("最も参加者が多い都道府県の特定", () => {
    it("最も参加者が多い都道府県を正しく特定する", () => {
      const prefectureCounts = {
        "東京都": 100,
        "大阪府": 50,
        "北海道": 30,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      // 実装では都道府県名が正規化される（「東京都」→「東京」）
      expect(result.current.hotPrefecture.name).toBe("東京");
      expect(result.current.hotPrefecture.count).toBe(100);
    });

    it("参加者がいない場合、空の名前と0を返す", () => {
      const { result } = renderHook(() => useHeatmapData({}));

      expect(result.current.hotPrefecture.name).toBe("");
      expect(result.current.hotPrefecture.count).toBe(0);
    });
  });

  describe("参加者がいる都道府県の数", () => {
    it("参加者がいる都道府県の数を正しくカウントする", () => {
      const prefectureCounts = {
        "東京都": 100,
        "大阪府": 50,
        "北海道": 30,
        "神奈川県": 0,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.activePrefectureCount).toBe(3);
    });

    it("全て0の場合、0を返す", () => {
      const prefectureCounts = {
        "東京都": 0,
        "大阪府": 0,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.activePrefectureCount).toBe(0);
    });
  });

  describe("地域ごとの参加者数集計", () => {
    it("関東地方の参加者数を正しく集計する", () => {
      const prefectureCounts = {
        "東京都": 100,
        "神奈川県": 50,
        "埼玉県": 30,
        "千葉県": 20,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.regionCounts["関東"]).toBe(200);
    });

    it("複数地域の参加者数を正しく集計する", () => {
      const prefectureCounts = {
        "東京都": 100,
        "大阪府": 50,
        "北海道": 30,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.regionCounts["関東"]).toBe(100);
      expect(result.current.regionCounts["関西"]).toBe(50);
      expect(result.current.regionCounts["北海道"]).toBe(30);
    });
  });

  describe("都道府県名の正規化", () => {
    it("「県」なしの名前でも正しく集計する", () => {
      const prefectureCounts = {
        "神奈川": 50,
        "埼玉": 30,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      // 正規化されて集計される
      expect(result.current.totalCount).toBe(80);
    });

    it("「東京」と「東京都」を同じ都道府県として扱う", () => {
      const prefectureCounts = {
        "東京": 50,
      };
      const { result } = renderHook(() => useHeatmapData(prefectureCounts));

      expect(result.current.totalCount).toBe(50);
      expect(result.current.activePrefectureCount).toBe(1);
    });
  });

  describe("データの再計算", () => {
    it("入力データが変更されると結果も更新される", () => {
      const initialCounts = { "東京都": 100 };
      const { result, rerender } = renderHook(
        ({ counts }: { counts: Record<string, number> }) => useHeatmapData(counts),
        { initialProps: { counts: initialCounts } }
      );

      expect(result.current.totalCount).toBe(100);

      const updatedCounts = { "東京都": 200 };
      rerender({ counts: updatedCounts });

      expect(result.current.totalCount).toBe(200);
    });
  });
});
