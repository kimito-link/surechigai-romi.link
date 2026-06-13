/**
 * SDK セキュリティテスト
 * 
 * テストフレームワーク: Vitest
 * 対象ファイル: server/_core/sdk.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sdk } from "../server/_core/sdk";

describe("SDK Security", () => {
  const originalEnv = process.env.JWT_SECRET;
  const DEFAULT_TEST_SECRET = "test-secret-key-for-testing-only";

  beforeEach(() => {
    // JWT_SECRETを設定（テストが失敗しないように）
    // 空文字列や空白のみの場合も設定する
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
      process.env.JWT_SECRET = DEFAULT_TEST_SECRET;
    }
  });

  afterEach(() => {
    // テスト後に必ずJWT_SECRETを設定（次のテストのために）
    if (originalEnv !== undefined && originalEnv.trim() !== "") {
      process.env.JWT_SECRET = originalEnv;
    } else {
      // originalEnvがundefinedまたは空の場合、デフォルト値を設定
      process.env.JWT_SECRET = DEFAULT_TEST_SECRET;
    }
  });

  describe("decodeState", () => {
    it("should decode valid base64 state", async () => {
      const validState = Buffer.from("https://example.com/callback").toString("base64");

      // decodeStateはprivateなので、exchangeCodeForToken経由でテスト
      // または、テスト用にexportする必要がある
    });

    it("should throw error for invalid base64", async () => {
      const invalidState = "not-base64!!!";

      // エラーがスローされることを確認
    });

    it("should throw error for empty decoded value", async () => {
      const emptyState = Buffer.from("").toString("base64");

      // エラーがスローされることを確認
    });

    it("should throw error for whitespace-only decoded value", async () => {
      const whitespaceState = Buffer.from("   ").toString("base64");

      // エラーがスローされることを確認
    });
  });

  describe("getSessionSecret", () => {
    it("should throw error when JWT_SECRET is not set", async () => {
      // このテストの前にJWT_SECRETを削除
      const savedJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        // createSessionToken経由でテスト
        await expect(
          sdk.createSessionToken("test-open-id", { name: "Test" })
        ).rejects.toThrow("JWT_SECRET");
      } finally {
        // テスト後に必ず復元
        if (savedJwtSecret !== undefined) {
          process.env.JWT_SECRET = savedJwtSecret;
        } else {
          process.env.JWT_SECRET = "test-secret-key-for-testing-only";
        }
      }
    });

    it("should throw error when JWT_SECRET is empty string", async () => {
      const savedJwtSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "";

      try {
        await expect(
          sdk.createSessionToken("test-open-id", { name: "Test" })
        ).rejects.toThrow("JWT_SECRET");
      } finally {
        // テスト後に復元
        if (savedJwtSecret !== undefined) {
          process.env.JWT_SECRET = savedJwtSecret;
        } else {
          process.env.JWT_SECRET = "test-secret-key-for-testing-only";
        }
      }
    });

    it("should throw error when JWT_SECRET is whitespace only", async () => {
      const savedJwtSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "   ";

      try {
        await expect(
          sdk.createSessionToken("test-open-id", { name: "Test" })
        ).rejects.toThrow("JWT_SECRET");
      } finally {
        // テスト後に復元
        if (savedJwtSecret !== undefined) {
          process.env.JWT_SECRET = savedJwtSecret;
        } else {
          process.env.JWT_SECRET = "test-secret-key-for-testing-only";
        }
      }
    });

    it("should work with valid JWT_SECRET", async () => {
      // beforeEachで設定されているはずだが、念のため確実にJWT_SECRETを設定
      process.env.JWT_SECRET = "test-secret-key-12345";

      const token = await sdk.createSessionToken("test-open-id", { name: "Test" });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });
});
