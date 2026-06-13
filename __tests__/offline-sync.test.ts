import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// AsyncStorageのモック
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// NetInfoのモック
vi.mock("@react-native-community/netinfo", () => ({
  fetch: vi.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: vi.fn(() => vi.fn()),
}));

describe("Offline Sync Queue", () => {
  beforeEach(() => {
    // ストレージをクリア
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Queue Operations", () => {
    it("should enqueue action to storage", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("participate", {
        challengeId: 1,
        displayName: "テストユーザー",
        message: "テストメッセージ",
      });

      const queue = await getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].type).toBe("participate");
      expect(queue[0].payload.challengeId).toBe(1);
      expect(queue[0].payload.displayName).toBe("テストユーザー");
    });

    it("should assign unique IDs to queued actions", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("participate", { challengeId: 1, displayName: "User1" });
      await enqueueAction("participate", { challengeId: 2, displayName: "User2" });

      const queue = await getSyncQueue();
      expect(queue.length).toBe(2);
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it("should track retry count", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("participate", { challengeId: 1, displayName: "User" });

      const queue = await getSyncQueue();
      expect(queue[0].retryCount).toBe(0);
    });

    it("should clear queue when requested", async () => {
      const { enqueueAction, clearSyncQueue, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("participate", { challengeId: 1, displayName: "User" });
      
      let queue = await getSyncQueue();
      expect(queue.length).toBe(1);
      
      await clearSyncQueue();
      
      queue = await getSyncQueue();
      expect(queue.length).toBe(0);
    });
  });

  describe("Action Types", () => {
    it("should support participate action type", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("participate", {
        challengeId: 1,
        displayName: "テスト",
        isAnonymous: false,
      });

      const queue = await getSyncQueue();
      expect(queue[0].type).toBe("participate");
    });

    it("should support cancel_participation action type", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("cancel_participation", {
        participationId: 123,
      });

      const queue = await getSyncQueue();
      expect(queue[0].type).toBe("cancel_participation");
    });

    it("should support create_challenge action type", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("create_challenge", {
        title: "テストチャレンジ",
        hostName: "ホスト名",
        eventDate: "2026-02-01",
      });

      const queue = await getSyncQueue();
      expect(queue[0].type).toBe("create_challenge");
    });

    it("should support update_challenge action type", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("update_challenge", {
        id: 1,
        title: "更新後のタイトル",
      });

      const queue = await getSyncQueue();
      expect(queue[0].type).toBe("update_challenge");
    });

    it("should support update_profile action type", async () => {
      const { enqueueAction, getSyncQueue } = await import("@/lib/offline-sync");
      
      await enqueueAction("update_profile", {
        displayName: "新しい名前",
        bio: "自己紹介",
      });

      const queue = await getSyncQueue();
      expect(queue[0].type).toBe("update_profile");
    });
  });

  describe("Sync Handler Registration", () => {
    it("should register sync handlers", async () => {
      const { registerSyncHandler } = await import("@/lib/offline-sync");
      
      const mockHandler = vi.fn();
      // registerSyncHandlerは内部のMapに保存するので、エラーなく実行できればOK
      expect(() => registerSyncHandler("participate", mockHandler)).not.toThrow();
    });
  });

  describe("Sync Status", () => {
    it("should return sync status", async () => {
      const { getSyncStatus } = await import("@/lib/offline-sync");
      
      const status = await getSyncStatus();
      expect(status).toHaveProperty("isSyncing");
      expect(status).toHaveProperty("pendingCount");
      expect(status).toHaveProperty("lastSyncAt");
      expect(status).toHaveProperty("lastError");
    });

    it("should update pending count after enqueue", async () => {
      const { enqueueAction, getSyncStatus, clearSyncQueue } = await import("@/lib/offline-sync");
      
      await clearSyncQueue();
      
      await enqueueAction("participate", {
        challengeId: 1,
        displayName: "User",
      });

      const status = await getSyncStatus();
      expect(status.pendingCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Queue Persistence", () => {
    it("should persist queue to storage", async () => {
      const { enqueueAction } = await import("@/lib/offline-sync");
      
      await enqueueAction("participate", {
        challengeId: 1,
        displayName: "Persistent User",
      });

      // ストレージに保存されていることを確認
      expect(mockStorage["offline_sync_queue"]).toBeDefined();
      
      const storedQueue = JSON.parse(mockStorage["offline_sync_queue"]);
      expect(storedQueue.length).toBeGreaterThanOrEqual(1);
      expect(storedQueue.some((item: { payload: { displayName: string } }) => 
        item.payload.displayName === "Persistent User"
      )).toBe(true);
    });
  });
});

describe("Offline Cache", () => {
  it("should check online status", async () => {
    const { isOnline } = await import("@/lib/offline-cache");
    
    const online = await isOnline();
    expect(typeof online).toBe("boolean");
  });
});
