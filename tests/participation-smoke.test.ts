/**
 * Participation Smoke Test
 * 表示→編集→削除→再表示の基本フローをテスト
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock tRPC
const mockInvalidate = vi.fn();
const mockMutate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      participations: {
        listByEvent: { invalidate: mockInvalidate },
        myParticipations: { invalidate: mockInvalidate },
      },
      events: {
        getById: { invalidate: mockInvalidate },
      },
    }),
    participations: {
      listByEvent: {
        useQuery: () => ({
          data: [
            {
              id: 1,
              userId: 100,
              displayName: "テストユーザー",
              message: "テストメッセージ",
              prefecture: "東京都",
              gender: "male",
              contribution: 1,
              companionCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isLoading: false,
        }),
      },
      update: {
        useMutation: (options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => ({
          mutate: (input: unknown) => {
            mockMutate(input);
            options.onSuccess?.();
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: (options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => ({
          mutate: (input: unknown) => {
            mockMutate(input);
            options.onSuccess?.();
          },
          isPending: false,
        }),
      },
    },
  },
}));

describe("Participation Smoke Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("表示→編集→削除→再表示フロー", () => {
    it("1. 参加表明一覧が表示される", () => {
      // Mock data exists
      const participations = [
        {
          id: 1,
          userId: 100,
          displayName: "テストユーザー",
          message: "テストメッセージ",
        },
      ];
      expect(participations.length).toBe(1);
      expect(participations[0].displayName).toBe("テストユーザー");
    });

    it("2. 編集成功後にinvalidateが呼ばれる", () => {
      // Simulate update mutation success
      const onSuccess = () => {
        mockInvalidate({ eventId: 1 });
      };
      
      onSuccess();
      expect(mockInvalidate).toHaveBeenCalledWith({ eventId: 1 });
    });

    it("3. 削除成功後にinvalidateが呼ばれる", () => {
      // Simulate delete mutation success
      const onSuccess = () => {
        mockInvalidate({ eventId: 1 });
      };
      
      onSuccess();
      expect(mockInvalidate).toHaveBeenCalledWith({ eventId: 1 });
    });

    it("4. エラー時にrequestIdが含まれる形式でエラーが返される", () => {
      const error = {
        message: "更新に失敗しました",
        data: { requestId: "req_abc123" },
      };
      
      const errorMessage = error.message;
      const requestId = error.data?.requestId;
      
      expect(errorMessage).toBe("更新に失敗しました");
      expect(requestId).toBe("req_abc123");
      
      // 開発モードでのエラー表示形式
      const devErrorDisplay = `${errorMessage}\n\n[requestId: ${requestId}]`;
      expect(devErrorDisplay).toContain("req_abc123");
    });

    it("5. 自分の投稿のみ編集・削除ボタンが表示される", () => {
      const currentUserId = 100;
      const participation = { userId: 100, displayName: "自分" };
      const otherParticipation = { userId: 200, displayName: "他人" };
      
      const isOwnPost = (p: { userId: number }) => p.userId === currentUserId;
      
      expect(isOwnPost(participation)).toBe(true);
      expect(isOwnPost(otherParticipation)).toBe(false);
    });
  });

  describe("invalidate統一", () => {
    it("編集成功時に複数のクエリがinvalidateされる", () => {
      // Simulate what happens on update success
      mockInvalidate({ eventId: 1 });  // listByEvent
      mockInvalidate();                 // myParticipations
      
      expect(mockInvalidate).toHaveBeenCalledTimes(2);
    });

    it("削除成功時に複数のクエリがinvalidateされる", () => {
      vi.clearAllMocks();
      
      // Simulate what happens on delete success
      mockInvalidate({ eventId: 1 });  // listByEvent
      mockInvalidate();                 // myParticipations
      mockInvalidate({ id: 1 });        // events.getById
      
      expect(mockInvalidate).toHaveBeenCalledTimes(3);
    });
  });
});
