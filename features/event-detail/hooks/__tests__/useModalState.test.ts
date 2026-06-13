/**
 * useModalState Hook Tests
 * モーダル状態管理フックのユニットテスト
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useModalState } from "../useModalState";

describe("useModalState", () => {
  describe("初期状態", () => {
    it("すべてのモーダルが閉じた状態で初期化される", () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.selectedPrefectureForModal).toBeNull();
      expect(result.current.selectedRegion).toBeNull();
      expect(result.current.showHostProfileModal).toBe(false);
      expect(result.current.selectedFan).toBeNull();
    });

    it("フィルター状態がデフォルト値で初期化される", () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.selectedPrefectureFilter).toBe("all");
      expect(result.current.showPrefectureFilterList).toBe(false);
      expect(result.current.selectedGenderFilter).toBe("all");
    });
  });

  describe("都道府県モーダル", () => {
    it("都道府県を選択できる", () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.setSelectedPrefectureForModal("東京都");
      });
      
      expect(result.current.selectedPrefectureForModal).toBe("東京都");
    });

    it("選択をクリアできる", () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.setSelectedPrefectureForModal("東京都");
      });
      
      act(() => {
        result.current.setSelectedPrefectureForModal(null);
      });
      
      expect(result.current.selectedPrefectureForModal).toBeNull();
    });
  });

  describe("地域モーダル", () => {
    it("地域を選択できる", () => {
      const { result } = renderHook(() => useModalState());
      const region = { name: "関東", prefectures: ["東京都", "神奈川県"] };
      
      act(() => {
        result.current.setSelectedRegion(region);
      });
      
      expect(result.current.selectedRegion).toEqual(region);
    });

    it("選択をクリアできる", () => {
      const { result } = renderHook(() => useModalState());
      const region = { name: "関東", prefectures: ["東京都", "神奈川県"] };
      
      act(() => {
        result.current.setSelectedRegion(region);
      });
      
      act(() => {
        result.current.setSelectedRegion(null);
      });
      
      expect(result.current.selectedRegion).toBeNull();
    });
  });

  describe("ホストプロフィールモーダル", () => {
    it("モーダルを開閉できる", () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.showHostProfileModal).toBe(false);
      
      act(() => {
        result.current.setShowHostProfileModal(true);
      });
      
      expect(result.current.showHostProfileModal).toBe(true);
      
      act(() => {
        result.current.setShowHostProfileModal(false);
      });
      
      expect(result.current.showHostProfileModal).toBe(false);
    });
  });

  describe("ファンプロフィールモーダル", () => {
    it("ファンを選択できる", () => {
      const { result } = renderHook(() => useModalState());
      const fan = {
        twitterId: "123456789",
        username: "testuser",
        displayName: "テストユーザー",
        profileImage: "https://example.com/image.jpg",
      };
      
      act(() => {
        result.current.setSelectedFan(fan);
      });
      
      expect(result.current.selectedFan).toEqual(fan);
    });

    it("選択をクリアできる", () => {
      const { result } = renderHook(() => useModalState());
      const fan = {
        twitterId: "123456789",
        username: "testuser",
        displayName: "テストユーザー",
        profileImage: undefined,
      };
      
      act(() => {
        result.current.setSelectedFan(fan);
      });
      
      act(() => {
        result.current.setSelectedFan(null);
      });
      
      expect(result.current.selectedFan).toBeNull();
    });
  });

  describe("フィルター状態", () => {
    it("都道府県フィルターを変更できる", () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.setSelectedPrefectureFilter("東京都");
      });
      
      expect(result.current.selectedPrefectureFilter).toBe("東京都");
    });

    it("都道府県フィルターリストの表示を切り替えられる", () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.setShowPrefectureFilterList(true);
      });
      
      expect(result.current.showPrefectureFilterList).toBe(true);
      
      act(() => {
        result.current.setShowPrefectureFilterList(false);
      });
      
      expect(result.current.showPrefectureFilterList).toBe(false);
    });

    it("性別フィルターを変更できる", () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.setSelectedGenderFilter("male");
      });
      
      expect(result.current.selectedGenderFilter).toBe("male");
      
      act(() => {
        result.current.setSelectedGenderFilter("female");
      });
      
      expect(result.current.selectedGenderFilter).toBe("female");
      
      act(() => {
        result.current.setSelectedGenderFilter("all");
      });
      
      expect(result.current.selectedGenderFilter).toBe("all");
    });
  });

  describe("複数の状態変更", () => {
    it("複数のモーダル状態を独立して管理できる", () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.setSelectedPrefectureForModal("東京都");
        result.current.setShowHostProfileModal(true);
        result.current.setSelectedGenderFilter("female");
      });
      
      expect(result.current.selectedPrefectureForModal).toBe("東京都");
      expect(result.current.showHostProfileModal).toBe(true);
      expect(result.current.selectedGenderFilter).toBe("female");
      
      // 他の状態は変わっていないことを確認
      expect(result.current.selectedRegion).toBeNull();
      expect(result.current.selectedFan).toBeNull();
      expect(result.current.selectedPrefectureFilter).toBe("all");
    });
  });
});
