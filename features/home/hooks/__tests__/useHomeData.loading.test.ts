/**
 * useHomeData Loading States Test
 * v6.59: スケルトンローディング改善のためのローディング状態テスト
 * 
 * 検証する契約:
 * - スケルトンは初回だけ（isInitialLoading）
 * - 更新中は小インジケータ（isRefreshing）
 * - 無限スクロールは別扱い（isLoadingMore）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useHomeData } from "../useHomeData";
import { trpc } from "@/lib/trpc";

// tRPCクエリをモック
vi.mock("@/lib/trpc", () => ({
  trpc: {
    events: {
      listPaginated: {
        useInfiniteQuery: vi.fn(),
      },
    },
    search: {
      challengesPaginated: {
        useInfiniteQuery: vi.fn(),
      },
    },
    categories: {
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
  },
}));

// AsyncStorageをモック
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
  },
}));

// NetInfoをモック
vi.mock("@react-native-community/netinfo", () => ({
  default: {
    fetch: vi.fn(() => Promise.resolve({ isConnected: true })),
    addEventListener: vi.fn(() => vi.fn()),
  },
}));

describe("useHomeData - Loading States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Case 1: 初回ロード中（データなし）
   * 期待: isInitialLoading=true, スケルトン表示
   */
  it("Case 1: 初回ロード中はisInitialLoading=trueでスケルトン表示", async () => {
    // モック設定: データなし、API取得中
    (trpc.events.listPaginated.useInfiniteQuery as any).mockReturnValue({
      data: undefined, // データなし
      isLoading: true, // 初回ロード中
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    });

    (trpc.search.challengesPaginated.useInfiniteQuery as any).mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useHomeData({ searchQuery: "", filter: "all", categoryFilter: null }));

    await waitFor(() => {
      // 初回ロード中の契約
      expect(result.current.isInitialLoading).toBe(true);
      expect(result.current.hasData).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isLoadingMore).toBe(false);
      
      // 後方互換性
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isDataLoading).toBe(true);
    });
  });

  /**
   * Case 2: データあり + 裏でfetch中
   * 期待: isRefreshing=true, 小インジケータ表示（スケルトンなし）
   */
  it("Case 2: データあり+裏でfetch中はisRefreshing=trueで小インジケータ表示", async () => {
    // モック設定: データあり、裏で更新中
    const mockChallenge = {
      id: 1,
      hostUserId: 1,
      hostTwitterId: "test",
      hostName: "Test Host",
      hostUsername: "testuser",
      hostProfileImage: null,
      title: "Test Challenge",
      description: "Test Description",
      goalType: "mobilization" as const,
      goalValue: 100,
      currentValue: 50,
      eventDate: new Date(),
      eventVenue: "Test Venue",
      eventType: "solo" as const,
      categoryId: null,
      ticketUrl: null,
      youtubeUrl: null,
      twitterHashtag: null,
      requiresFollowCheck: false,
      requiredTwitterAccount: null,
      participationMessage: null,
      allowVideoUse: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active" as const,
      aiSummary: null,
      intentTags: null,
      regionSummary: null,
      participantSummary: null,
      aiSummaryUpdatedAt: null,
    };

    (trpc.events.listPaginated.useInfiniteQuery as any).mockReturnValue({
      data: {
        pages: [{ items: [mockChallenge], nextCursor: null }],
      },
      isLoading: false, // 初回完了
      isFetching: true, // 裏で更新中
      isFetchingNextPage: false, // ページネーションではない
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    });

    (trpc.search.challengesPaginated.useInfiniteQuery as any).mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useHomeData({ searchQuery: "", filter: "all", categoryFilter: null }));

    await waitFor(() => {
      // データあり+更新中の契約
      expect(result.current.hasData).toBe(true);
      expect(result.current.isInitialLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(true); // 裏で更新中
      expect(result.current.isLoadingMore).toBe(false); // ページネーションではない
      
      // 排他性の確認（重要）
      expect(result.current.isRefreshing && !result.current.isLoadingMore).toBe(true);
    });
  });

  /**
   * Case 3: 次ページ取得中
   * 期待: isLoadingMore=true, リスト末尾にインジケータ（refreshとは別）
   */
  it("Case 3: 次ページ取得中はisLoadingMore=trueでリスト末尾にインジケータ", async () => {
    // モック設定: データあり、次ページ取得中
    const mockChallenge = {
      id: 1,
      hostUserId: 1,
      hostTwitterId: "test",
      hostName: "Test Host",
      hostUsername: "testuser",
      hostProfileImage: null,
      title: "Test Challenge",
      description: "Test Description",
      goalType: "mobilization" as const,
      goalValue: 100,
      currentValue: 50,
      eventDate: new Date(),
      eventVenue: "Test Venue",
      eventType: "solo" as const,
      categoryId: null,
      ticketUrl: null,
      youtubeUrl: null,
      twitterHashtag: null,
      requiresFollowCheck: false,
      requiredTwitterAccount: null,
      participationMessage: null,
      allowVideoUse: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active" as const,
      aiSummary: null,
      intentTags: null,
      regionSummary: null,
      participantSummary: null,
      aiSummaryUpdatedAt: null,
    };

    (trpc.events.listPaginated.useInfiniteQuery as any).mockReturnValue({
      data: {
        pages: [{ items: [mockChallenge], nextCursor: 1 }],
      },
      isLoading: false,
      isFetching: true, // fetch中
      isFetchingNextPage: true, // 次ページ取得中
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    });

    (trpc.search.challengesPaginated.useInfiniteQuery as any).mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useHomeData({ searchQuery: "", filter: "all", categoryFilter: null }));

    await waitFor(() => {
      // 次ページ取得中の契約
      expect(result.current.hasData).toBe(true);
      expect(result.current.isLoadingMore).toBe(true); // 次ページ取得中
      expect(result.current.isRefreshing).toBe(false); // refreshとは別
      
      // 排他性の確認（重要）
      expect(result.current.isLoadingMore && !result.current.isRefreshing).toBe(true);
    });
  });
});
