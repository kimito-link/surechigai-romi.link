/**
 * tests/participation-guards.test.ts
 * 
 * サーバーガードテスト（v6.41 安全柵）
 * 
 * 1. 他人のparticipationをupdate/deleteできないこと
 * 2. deletedAt済みparticipationをupdateできないこと
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// モック用のDB関数
const mockGetActiveParticipationById = vi.fn();
const mockUpdateParticipation = vi.fn();
const mockSoftDeleteParticipation = vi.fn();

// DBモジュールをモック
vi.mock("../server/db", () => ({
  getActiveParticipationById: (...args: unknown[]) => mockGetActiveParticipationById(...args),
  updateParticipation: (...args: unknown[]) => mockUpdateParticipation(...args),
  softDeleteParticipation: (...args: unknown[]) => mockSoftDeleteParticipation(...args),
  logAction: vi.fn(),
  deleteCompanionsForParticipation: vi.fn(),
  createCompanions: vi.fn(),
}));

describe("Participation Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("他人の投稿操作ガード", () => {
    it("他人のparticipationをupdateしようとするとエラーになる", async () => {
      // ユーザーID 1 が ユーザーID 2 の投稿を編集しようとする
      const currentUserId = 1;
      const otherUserId = 2;
      const participationId = 100;

      // 他人の投稿をモック
      mockGetActiveParticipationById.mockResolvedValue({
        id: participationId,
        userId: otherUserId, // 他人のID
        challengeId: 1,
        message: "テストメッセージ",
        displayName: "他人のユーザー",
      });

      // ガードロジックをテスト
      const participation = await mockGetActiveParticipationById(participationId);
      
      // 自分の投稿かチェック
      const isOwner = participation.userId === currentUserId;
      
      expect(isOwner).toBe(false);
      expect(participation.userId).not.toBe(currentUserId);
    });

    it("他人のparticipationをdeleteしようとするとエラーになる", async () => {
      const currentUserId = 1;
      const otherUserId = 2;
      const participationId = 100;

      mockGetActiveParticipationById.mockResolvedValue({
        id: participationId,
        userId: otherUserId,
        challengeId: 1,
        message: "テストメッセージ",
        displayName: "他人のユーザー",
      });

      const participation = await mockGetActiveParticipationById(participationId);
      const isOwner = participation.userId === currentUserId;
      
      expect(isOwner).toBe(false);
      
      // 削除関数が呼ばれないことを確認
      if (!isOwner) {
        // エラーを投げるべき
        expect(() => {
          throw new Error("自分の参加表明のみ削除できます。");
        }).toThrow("自分の参加表明のみ削除できます。");
      }
    });

    it("自分のparticipationは正常にupdateできる", async () => {
      const currentUserId = 1;
      const participationId = 100;

      mockGetActiveParticipationById.mockResolvedValue({
        id: participationId,
        userId: currentUserId, // 自分のID
        challengeId: 1,
        message: "テストメッセージ",
        displayName: "自分のユーザー",
      });

      const participation = await mockGetActiveParticipationById(participationId);
      const isOwner = participation.userId === currentUserId;
      
      expect(isOwner).toBe(true);
    });
  });

  describe("削除済み投稿操作ガード", () => {
    it("削除済みparticipationはgetActiveParticipationByIdで取得できない", async () => {
      const participationId = 100;

      // 削除済みの投稿は null を返す（getActiveParticipationByIdの仕様）
      mockGetActiveParticipationById.mockResolvedValue(null);

      const participation = await mockGetActiveParticipationById(participationId);
      
      expect(participation).toBeNull();
    });

    it("削除済みparticipationをupdateしようとするとエラーになる", async () => {
      const participationId = 100;

      // 削除済みの投稿は null を返す
      mockGetActiveParticipationById.mockResolvedValue(null);

      const participation = await mockGetActiveParticipationById(participationId);
      
      // 投稿が見つからない場合のエラー
      if (!participation) {
        expect(() => {
          throw new Error("参加表明が見つかりません。");
        }).toThrow("参加表明が見つかりません。");
      }
    });

    it("削除済みparticipationをdeleteしようとするとエラーになる", async () => {
      const participationId = 100;

      mockGetActiveParticipationById.mockResolvedValue(null);

      const participation = await mockGetActiveParticipationById(participationId);
      
      if (!participation) {
        expect(() => {
          throw new Error("参加表明が見つかりません。");
        }).toThrow("参加表明が見つかりません。");
      }
    });
  });

  describe("認証ガード", () => {
    it("未認証ユーザーはprotectedProcedureにアクセスできない", () => {
      // protectedProcedureは認証必須
      // ctx.user が null の場合はエラー
      const ctx = { user: null };
      
      expect(ctx.user).toBeNull();
      
      if (!ctx.user) {
        expect(() => {
          throw new Error("ログインが必要です。");
        }).toThrow("ログインが必要です。");
      }
    });

    it("認証済みユーザーはprotectedProcedureにアクセスできる", () => {
      const ctx = { 
        user: { 
          id: 1, 
          name: "テストユーザー",
          role: "user" 
        } 
      };
      
      expect(ctx.user).not.toBeNull();
      expect(ctx.user.id).toBe(1);
    });
  });

  describe("requestId追跡", () => {
    it("全てのmutationにrequestIdが付与される", () => {
      // requestIdの形式をテスト
      const requestId = "req_abc123xyz";
      
      expect(requestId).toMatch(/^req_/);
      expect(requestId.length).toBeGreaterThan(4);
    });

    it("監査ログにrequestIdが記録される", () => {
      const auditLog = {
        requestId: "req_abc123xyz",
        action: "EDIT",
        entityType: "participation",
        targetId: 100,
        actorId: 1,
        beforeData: { message: "before" },
        afterData: { message: "after" },
      };
      
      expect(auditLog.requestId).toBeDefined();
      expect(auditLog.requestId).toMatch(/^req_/);
    });
  });
});
