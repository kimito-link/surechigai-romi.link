/**
 * useOfflineChallenge フックのユニットテスト
 * 
 * テスト対象:
 * - オンライン時のチャレンジ作成
 * - オフライン時のキュー追加
 * - エラーハンドリング
 * - コールバック関数の呼び出し
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

// モックの設定
const mockMutate = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    events: {
      create: {
        useMutation: (...args: unknown[]) => mockUseMutation(...args),
      },
    },
  },
}));

const mockIsOnline = vi.fn();
vi.mock("@/lib/offline-cache", () => ({
  isOnline: () => mockIsOnline(),
}));

const mockEnqueueAction = vi.fn();
vi.mock("@/lib/offline-sync", () => ({
  enqueueAction: (...args: unknown[]) => mockEnqueueAction(...args),
}));

vi.mock("react-native", () => ({
  Alert: {
    alert: vi.fn(),
  },
  Platform: { OS: "web" },
}));

// テスト用のチャレンジデータ
const mockChallengeData = {
  title: "Test Challenge",
  description: "Test Description",
  eventDate: "2024-06-01",
  venue: "Tokyo",
  hostTwitterId: "twitter_123",
  hostName: "Test Host",
  hostUsername: "testhost",
  hostProfileImage: "https://example.com/image.jpg",
  hostFollowersCount: 1000,
  hostDescription: "Host Description",
};

describe("useOfflineChallenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // デフォルトのモック設定
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    
    mockIsOnline.mockResolvedValue(true);
    mockEnqueueAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初期状態", () => {
    it("isSubmittingはfalse", async () => {
      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      expect(result.current.isSubmitting).toBe(false);
    });

    it("isQueuedはfalse", async () => {
      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      expect(result.current.isQueued).toBe(false);
    });

    it("isPendingはfalse", async () => {
      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      expect(result.current.isPending).toBe(false);
    });
  });

  describe("オンライン時の送信", () => {
    it("オンライン時はAPIを直接呼び出す", async () => {
      mockIsOnline.mockResolvedValue(true);

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      // events.create は認証必須のため hostTwitterId はサーバー側で ctx.user から取得（クライアントでは渡さない）
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockChallengeData.title,
          hostName: mockChallengeData.hostName,
          eventDate: mockChallengeData.eventDate,
        })
      );
    });

    it("送信中はisSubmittingがtrue", async () => {
      mockIsOnline.mockResolvedValue(true);
      // mutateが呼ばれても即座に完了しないようにする
      mockMutate.mockImplementation(() => {});

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      act(() => {
        result.current.submit(mockChallengeData);
      });

      // 非同期処理の開始を待つ
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });
    });

    it("成功時にonSuccessコールバックが呼ばれる", async () => {
      const onSuccess = vi.fn();
      
      // useMutationのonSuccessを呼び出すようにモック
      mockUseMutation.mockImplementation((options: { onSuccess?: (data: { id: number }) => void }) => ({
        mutate: (data: unknown) => {
          // 即座にonSuccessを呼び出す
          options?.onSuccess?.({ id: 123 });
        },
        isPending: false,
      }));

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge({ onSuccess }));

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      expect(onSuccess).toHaveBeenCalledWith(123);
    });

    it("エラー時にonErrorコールバックが呼ばれる", async () => {
      const onError = vi.fn();
      
      // useMutationのonErrorを呼び出すようにモック
      mockUseMutation.mockImplementation((options: { onError?: (error: { message: string }) => void }) => ({
        mutate: (data: unknown) => {
          // 即座にonErrorを呼び出す
          options?.onError?.({ message: "API Error" });
        },
        isPending: false,
      }));

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge({ onError }));

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("オフライン時の送信", () => {
    it("オフライン時はキューに追加される", async () => {
      mockIsOnline.mockResolvedValue(false);

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      expect(mockEnqueueAction).toHaveBeenCalledWith(
        "create_challenge",
        expect.objectContaining({
          title: mockChallengeData.title,
          queuedAt: expect.any(Number),
        })
      );
    });

    it("キュー追加後はisQueuedがtrue", async () => {
      mockIsOnline.mockResolvedValue(false);

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      expect(result.current.isQueued).toBe(true);
    });

    it("キュー追加後にonOfflineQueuedコールバックが呼ばれる", async () => {
      mockIsOnline.mockResolvedValue(false);
      const onOfflineQueued = vi.fn();

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge({ onOfflineQueued }));

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      expect(onOfflineQueued).toHaveBeenCalled();
    });

    it("キュー追加失敗時にonErrorコールバックが呼ばれる", async () => {
      mockIsOnline.mockResolvedValue(false);
      mockEnqueueAction.mockRejectedValue(new Error("Queue Error"));
      const onError = vi.fn();

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge({ onError }));

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("返り値の構造", () => {
    it("必要なプロパティがすべて含まれている", async () => {
      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      expect(result.current).toHaveProperty("submit");
      expect(result.current).toHaveProperty("isSubmitting");
      expect(result.current).toHaveProperty("isQueued");
      expect(result.current).toHaveProperty("isPending");
    });

    it("submitは関数である", async () => {
      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      expect(typeof result.current.submit).toBe("function");
    });
  });

  describe("オプションなしでの使用", () => {
    it("オプションなしでも正常に動作する", async () => {
      mockIsOnline.mockResolvedValue(true);

      const { useOfflineChallenge } = await import("../use-offline-challenge");
      const { result } = renderHook(() => useOfflineChallenge());

      await act(async () => {
        await result.current.submit(mockChallengeData);
      });

      // エラーなく完了
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
