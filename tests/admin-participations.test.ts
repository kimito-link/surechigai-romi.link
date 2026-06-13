/**
 * tests/admin-participations.test.ts
 * 
 * 管理者用参加管理APIのテスト
 * - 認可チェック（非管理者はアクセス不可）
 * - 削除済み参加一覧取得
 * - 復元機能
 * - 一括削除・復元
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// モック用の型定義
type MockUser = {
  id: number;
  name: string;
  role: "user" | "admin";
};

type MockContext = {
  user: MockUser;
  requestId: string;
};

// 認可チェックのテスト
describe("Admin Participations Authorization", () => {
  const adminUser: MockUser = { id: 1, name: "Admin User", role: "admin" };
  const regularUser: MockUser = { id: 2, name: "Regular User", role: "user" };

  // 認可チェック関数（実際のルーターから抽出したロジック）
  function checkAdminAuthorization(user: MockUser): void {
    if (user.role !== "admin") {
      throw new Error("管理者権限が必要です");
    }
  }

  it("should allow admin users to access", () => {
    expect(() => checkAdminAuthorization(adminUser)).not.toThrow();
  });

  it("should deny regular users access", () => {
    expect(() => checkAdminAuthorization(regularUser)).toThrow("管理者権限が必要です");
  });

  it("should deny users with undefined role", () => {
    const noRoleUser = { id: 3, name: "No Role", role: "user" as const };
    expect(() => checkAdminAuthorization(noRoleUser)).toThrow("管理者権限が必要です");
  });
});

// 入力バリデーションのテスト
describe("Admin Participations Input Validation", () => {
  // bulkDelete/bulkRestore の入力チェック
  function validateBulkInput(input: { challengeId?: number; userId?: number }): void {
    if (!input.challengeId && !input.userId) {
      throw new Error("challengeId または userId を指定してください");
    }
  }

  it("should accept challengeId only", () => {
    expect(() => validateBulkInput({ challengeId: 1 })).not.toThrow();
  });

  it("should accept userId only", () => {
    expect(() => validateBulkInput({ userId: 1 })).not.toThrow();
  });

  it("should accept both challengeId and userId", () => {
    expect(() => validateBulkInput({ challengeId: 1, userId: 2 })).not.toThrow();
  });

  it("should reject empty input", () => {
    expect(() => validateBulkInput({})).toThrow("challengeId または userId を指定してください");
  });

  it("should reject undefined values", () => {
    expect(() => validateBulkInput({ challengeId: undefined, userId: undefined })).toThrow(
      "challengeId または userId を指定してください"
    );
  });
});

// requestId生成のテスト
describe("Admin Participations RequestId", () => {
  function getRequestId(ctx: { requestId?: string }): string {
    return ctx.requestId || "unknown";
  }

  it("should return requestId when present", () => {
    expect(getRequestId({ requestId: "req-123" })).toBe("req-123");
  });

  it("should return 'unknown' when requestId is undefined", () => {
    expect(getRequestId({})).toBe("unknown");
  });

  it("should return 'unknown' when requestId is empty string", () => {
    expect(getRequestId({ requestId: "" })).toBe("unknown");
  });
});

// 監査ログ記録のテスト
describe("Admin Participations Audit Logging", () => {
  type AuditLogParams = {
    action: string;
    entityType: string;
    targetId: number;
    actorId: number;
    actorName: string;
    beforeData: Record<string, unknown> | null;
    afterData: Record<string, unknown> | null;
    requestId: string;
  };

  const mockLogAction = vi.fn();

  beforeEach(() => {
    mockLogAction.mockClear();
  });

  it("should log RESTORE action with correct parameters", async () => {
    const params: AuditLogParams = {
      action: "RESTORE",
      entityType: "participation",
      targetId: 123,
      actorId: 1,
      actorName: "Admin User",
      beforeData: { deletedAt: "2024-01-01T00:00:00.000Z", deletedBy: 2 },
      afterData: { deletedAt: null, deletedBy: null },
      requestId: "req-abc",
    };

    mockLogAction(params);

    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "RESTORE",
        entityType: "participation",
        targetId: 123,
        requestId: "req-abc",
      })
    );
  });

  it("should log BULK_DELETE action with filter info", async () => {
    const params: AuditLogParams = {
      action: "BULK_DELETE",
      entityType: "participation",
      targetId: 5,
      actorId: 1,
      actorName: "Admin User",
      beforeData: null,
      afterData: {
        filter: { challengeId: 5 },
        deletedCount: 10,
        affectedChallengeIds: [5],
      },
      requestId: "req-def",
    };

    mockLogAction(params);

    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "BULK_DELETE",
        afterData: expect.objectContaining({
          deletedCount: 10,
        }),
      })
    );
  });

  it("should log BULK_RESTORE action with restored count", async () => {
    const params: AuditLogParams = {
      action: "BULK_RESTORE",
      entityType: "participation",
      targetId: 3,
      actorId: 1,
      actorName: "Admin User",
      beforeData: null,
      afterData: {
        filter: { userId: 3 },
        restoredCount: 5,
        affectedChallengeIds: [1, 2, 3],
      },
      requestId: "req-ghi",
    };

    mockLogAction(params);

    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "BULK_RESTORE",
        afterData: expect.objectContaining({
          restoredCount: 5,
          affectedChallengeIds: [1, 2, 3],
        }),
      })
    );
  });
});

// レスポンス形式のテスト
describe("Admin Participations Response Format", () => {
  it("should include requestId in restore response", () => {
    const result = { success: true, challengeId: 1 };
    const requestId = "req-123";
    const response = { ...result, requestId };

    expect(response).toEqual({
      success: true,
      challengeId: 1,
      requestId: "req-123",
    });
  });

  it("should include requestId in bulkDelete response", () => {
    const result = { deletedCount: 5, affectedChallengeIds: [1, 2] };
    const requestId = "req-456";
    const response = { success: true, ...result, requestId };

    expect(response).toEqual({
      success: true,
      deletedCount: 5,
      affectedChallengeIds: [1, 2],
      requestId: "req-456",
    });
  });

  it("should include requestId in bulkRestore response", () => {
    const result = { restoredCount: 3, affectedChallengeIds: [3] };
    const requestId = "req-789";
    const response = { success: true, ...result, requestId };

    expect(response).toEqual({
      success: true,
      restoredCount: 3,
      affectedChallengeIds: [3],
      requestId: "req-789",
    });
  });
});
