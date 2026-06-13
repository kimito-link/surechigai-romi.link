/**
 * useEventDetail Hook Tests
 * イベント詳細フックのユニットテスト
 * 
 * Note: このフックはtRPCクエリを使用するため、
 * 完全なテストにはモックが必要です。
 * ここでは計算ロジックとユーティリティ関数をテストします。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// React Nativeのモック
vi.mock("react-native", () => ({
  Alert: {
    alert: vi.fn(),
  },
  Dimensions: {
    get: vi.fn().mockReturnValue({ width: 375, height: 812 }),
  },
}));

// useAuthのモック
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "テストユーザー",
      username: "testuser",
      profileImage: "https://example.com/image.jpg",
      followersCount: 100,
      openId: "openid123",
    },
    login: vi.fn(),
  }),
}));

// useFavoritesのモック
vi.mock("@/hooks/use-favorites", () => ({
  useFavorites: () => ({
    isFavorite: vi.fn().mockReturnValue(false),
    toggleFavorite: vi.fn(),
  }),
}));

// goalTypeConfigのモック
vi.mock("@/constants/goal-types", () => ({
  goalTypeConfig: {
    attendance: { unit: "人" },
    sales: { unit: "円" },
    default: { unit: "人" },
  },
}));

// tRPCのモック
const mockChallenge = {
  id: 1,
  title: "テストチャレンジ",
  description: "テスト説明",
  eventDate: "2026-02-01",
  venue: "テスト会場",
  goalType: "attendance",
  goalValue: 100,
  goalUnit: "人",
  currentValue: 50,
  hostUserId: 2,
  hostTwitterId: "host123",
  hostName: "ホストユーザー",
  hostUsername: "hostuser",
  hostProfileImage: "https://example.com/host.jpg",
  hostFollowersCount: 1000,
  hostDescription: "ホストの説明",
  ticketPresale: 3000,
  ticketDoor: 3500,
  ticketUrl: "https://example.com/ticket",
};

const mockParticipations = [
  {
    id: 1,
    challengeId: 1,
    userId: 1,
    twitterId: "123456789",
    username: "testuser",
    displayName: "テストユーザー",
    profileImage: "https://example.com/image.jpg",
    message: "応援しています！",
    contribution: 1,
    companionCount: 0,
    prefecture: "東京都",
    gender: "male" as const,
    allowVideoUse: true,
    isAnonymous: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    challengeId: 1,
    userId: 3,
    twitterId: "987654321",
    username: "user2",
    displayName: "ユーザー2",
    profileImage: null,
    message: null,
    contribution: 2,
    companionCount: 1,
    prefecture: "大阪府",
    gender: "female" as const,
    allowVideoUse: false,
    isAnonymous: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    events: {
      getById: {
        useQuery: () => ({
          data: mockChallenge,
          isLoading: false,
        }),
      },
    },
    participations: {
      listByEvent: {
        useQuery: () => ({
          data: mockParticipations,
          isLoading: false,
          refetch: vi.fn().mockResolvedValue(undefined),
        }),
      },
      getAttendanceTypeCounts: {
        useQuery: () => ({
          data: { venue: 30, streaming: 15, both: 5, total: 50 },
          isLoading: false,
        }),
      },
    },
    companions: {
      forChallenge: {
        useQuery: () => ({
          data: [],
        }),
      },
    },
    follows: {
      isFollowing: {
        useQuery: () => ({
          data: false,
        }),
      },
      followerIds: {
        useQuery: () => ({
          data: [],
        }),
      },
      follow: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
      unfollow: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
    },
    momentum: {
      get: {
        useQuery: () => ({
          data: { recent24h: 10, recent1h: 2 },
        }),
      },
    },
  },
}));

import { renderHook } from "@testing-library/react";
import { useEventDetail } from "../useEventDetail";

describe("useEventDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期化", () => {
    it("challengeIdを指定して初期化できる", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.challenge).toBeDefined();
    });

    it("ローディング状態を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.challengeLoading).toBe("boolean");
      expect(typeof result.current.participationsLoading).toBe("boolean");
    });
  });

  describe("計算値", () => {
    it("進捗率を計算する", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      // currentValue: 50, goalValue: 100 => progress: 50
      expect(result.current.progress).toBe(50);
    });

    it("残り人数を計算する", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      // goalValue: 100, currentValue: 50 => remaining: 50
      expect(result.current.remaining).toBe(50);
    });

    it("単位を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.unit).toBeDefined();
    });

    it("現在値を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.currentValue).toBe(50);
    });

    it("目標値を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.goalValue).toBe(100);
    });
  });

  describe("日付処理", () => {
    it("イベント日付を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.eventDate).toBeDefined();
    });

    it("フォーマットされた日付を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.formattedDate).toBe("string");
    });

    it("日付未定フラグを返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.isDateUndecided).toBe("boolean");
    });
  });

  describe("ユーザー情報", () => {
    it("ユーザー情報を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe(1);
    });

    it("ログイン関数を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.login).toBe("function");
    });

    it("現在のユーザーのTwitter IDを返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      // user.openIdがTwitter IDとして使用される場合
      expect(result.current.currentUserTwitterId).toBeDefined();
    });
  });

  describe("お気に入り機能", () => {
    it("お気に入り状態を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.isChallengeFavorite).toBe("boolean");
    });

    it("お気に入り切り替え関数を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.toggleFavorite).toBe("function");
    });
  });

  describe("フォロー機能", () => {
    it("フォロー状態を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.isFollowing).toBeDefined();
    });

    it("ホストユーザーIDを返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.hostUserId).toBe(2);
    });

    it("フォロー切り替え関数を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.handleFollowToggle).toBe("function");
    });
  });

  describe("参加情報", () => {
    it("参加者リストを返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.participations).toBeDefined();
      expect(Array.isArray(result.current.participations)).toBe(true);
    });

    it("自分の参加情報を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      // user.id === 1 の参加情報を返す
      expect(result.current.myParticipation).toBeDefined();
    });

    it("同伴者リストを返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.challengeCompanions).toBeDefined();
    });
  });

  describe("勢い情報", () => {
    it("勢いデータを返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.momentum).toBeDefined();
      expect(typeof result.current.momentum.recent24h).toBe("number");
      expect(typeof result.current.momentum.recent1h).toBe("number");
      expect(typeof result.current.momentum.isHot).toBe("boolean");
    });
  });

  describe("都道府県別カウント", () => {
    it("都道府県別参加者数を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(result.current.prefectureCounts).toBeDefined();
      expect(typeof result.current.prefectureCounts).toBe("object");
    });
  });

  describe("リフェッチ", () => {
    it("refetch関数を返す", () => {
      const { result } = renderHook(() => useEventDetail({ challengeId: 1 }));
      
      expect(typeof result.current.refetch).toBe("function");
    });
  });
});
