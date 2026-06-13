/**
 * useEventActions Hook Tests
 * イベントアクションフックのユニットテスト
 * 
 * Note: このフックはtRPCミューテーションを使用するため、
 * 完全なテストにはモックが必要です。
 * ここでは状態管理のロジックをテストします。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Share関数のモック
vi.mock("react-native", () => ({
  Alert: {
    alert: vi.fn(),
  },
  Share: {
    share: vi.fn().mockResolvedValue({ action: "sharedAction" }),
  },
  Dimensions: {
    get: vi.fn().mockReturnValue({ width: 375, height: 812 }),
  },
}));

// shareToTwitterのモック
vi.mock("@/lib/share", () => ({
  shareToTwitter: vi.fn().mockResolvedValue(undefined),
}));

// tRPCのモック
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      participations: {
        byChallenge: {
          invalidate: vi.fn(),
        },
      },
      events: {
        detail: {
          invalidate: vi.fn(),
        },
      },
    }),
    ogp: {
      generateChallengeOgp: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ url: "https://example.com/ogp" }),
        }),
      },
    },
    cheers: {
      send: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
    },
    participations: {
      delete: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

import { renderHook, act } from "@testing-library/react";
import { useEventActions } from "../useEventActions";
import { Share } from "react-native";
import { shareToTwitter } from "@/lib/share";

describe("useEventActions", () => {
  const defaultOptions = {
    challengeId: 1,
    challengeTitle: "テストチャレンジ",
    currentValue: 50,
    goalValue: 100,
    unit: "人",
    progress: 50,
    remaining: 50,
    refetch: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期状態", () => {
    it("削除モーダルが閉じた状態で初期化される", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      expect(result.current.showDeleteParticipationModal).toBe(false);
      expect(result.current.deleteTargetParticipation).toBeNull();
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isGeneratingOgp).toBe(false);
    });
  });

  describe("削除モーダル状態", () => {
    it("削除モーダルの表示状態を切り替えられる", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      act(() => {
        result.current.setShowDeleteParticipationModal(true);
      });
      
      expect(result.current.showDeleteParticipationModal).toBe(true);
      
      act(() => {
        result.current.setShowDeleteParticipationModal(false);
      });
      
      expect(result.current.showDeleteParticipationModal).toBe(false);
    });

    it("削除対象の参加情報を設定できる", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      const participation = {
        id: 1,
        challengeId: 1,
        userId: 1,
        twitterId: "123456789",
        username: "testuser",
        displayName: "テストユーザー",
        profileImage: "https://example.com/image.jpg",
        message: "テストメッセージ",
        contribution: 1,
        companionCount: 0,
        prefecture: "東京都",
        gender: "male" as const,
        allowVideoUse: true,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      act(() => {
        result.current.setDeleteTargetParticipation(participation);
      });
      
      expect(result.current.deleteTargetParticipation).toEqual(participation);
    });

    it("削除対象をクリアできる", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      const participation = {
        id: 1,
        challengeId: 1,
        userId: 1,
        twitterId: "123456789",
        username: "testuser",
        displayName: "テストユーザー",
        profileImage: null,
        message: null,
        contribution: 1,
        companionCount: 0,
        prefecture: "東京都",
        gender: "male" as const,
        allowVideoUse: true,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      act(() => {
        result.current.setDeleteTargetParticipation(participation);
      });
      
      act(() => {
        result.current.setDeleteTargetParticipation(null);
      });
      
      expect(result.current.deleteTargetParticipation).toBeNull();
    });
  });

  describe("シェア機能", () => {
    it("handleShareが定義されている", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      expect(typeof result.current.handleShare).toBe("function");
    });

    it("handleTwitterShareが定義されている", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      expect(typeof result.current.handleTwitterShare).toBe("function");
    });

    it("handleShareWithOgpが定義されている", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      expect(typeof result.current.handleShareWithOgp).toBe("function");
    });

    it("handleShareを呼び出すとShare.shareが呼ばれる", async () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      await act(async () => {
        await result.current.handleShare();
      });
      
      expect(Share.share).toHaveBeenCalled();
    });

    it("handleTwitterShareを呼び出すとshareToTwitterが呼ばれる", async () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      await act(async () => {
        await result.current.handleTwitterShare();
      });
      
      expect(shareToTwitter).toHaveBeenCalled();
    });
  });

  describe("エール機能", () => {
    it("handleSendCheerが定義されている", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      expect(typeof result.current.handleSendCheer).toBe("function");
    });
  });

  describe("削除機能", () => {
    it("handleDeleteParticipationが定義されている", () => {
      const { result } = renderHook(() => useEventActions(defaultOptions));
      
      expect(typeof result.current.handleDeleteParticipation).toBe("function");
    });
  });

  describe("オプションの変更", () => {
    it("異なるオプションで初期化できる", () => {
      const customOptions = {
        ...defaultOptions,
        challengeId: 2,
        challengeTitle: "別のチャレンジ",
        currentValue: 75,
        goalValue: 150,
      };
      
      const { result } = renderHook(() => useEventActions(customOptions));
      
      // フックが正常に初期化されることを確認
      expect(result.current.showDeleteParticipationModal).toBe(false);
      expect(result.current.isGeneratingOgp).toBe(false);
    });
  });
});
