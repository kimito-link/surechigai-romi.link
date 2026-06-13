/**
 * Twitter Routes セキュリティテスト
 * 
 * テストフレームワーク: Vitest
 * 対象ファイル: server/twitter-routes.ts
 * 
 * 注意: extractBearerToken と createErrorResponse はprivate関数のため、
 * 実際のエンドポイント経由でテストする必要がある
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Request, Response } from "express";
import { registerTwitterRoutes, extractBearerToken, createErrorResponse } from "../server/twitter-routes";

describe("Twitter Routes Security", () => {
  describe("extractBearerToken", () => {
    it("should extract token from valid Bearer header", () => {
      const token = extractBearerToken("Bearer valid-token-12345");
      
      expect(token).toBe("valid-token-12345");
    });

    it("should return null for missing Authorization header", () => {
      const token = extractBearerToken(undefined);
      
      expect(token).toBeNull();
    });

    it("should return null for invalid Bearer format (no space)", () => {
      const token = extractBearerToken("Bearervalid-token-12345");
      
      expect(token).toBeNull();
    });

    it("should accept lowercase bearer (case-insensitive)", () => {
      const token = extractBearerToken("bearer valid-token-12345");
      
      expect(token).toBe("valid-token-12345");
    });

    it("should return null for empty token", () => {
      const token = extractBearerToken("Bearer ");
      
      expect(token).toBeNull();
    });

    it("should trim token with whitespace", () => {
      const token = extractBearerToken("Bearer  token-with-spaces  ");
      
      expect(token).toBe("token-with-spaces");
    });

    it("should handle very long token", () => {
      const longToken = "A".repeat(10000);
      const token = extractBearerToken(`Bearer ${longToken}`);
      
      expect(token).toBe(longToken);
      expect(token?.length).toBe(10000);
    });
  });

  describe("createErrorResponse", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      vi.resetModules();
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        vi.stubEnv("NODE_ENV", originalEnv);
      } else {
        vi.stubEnv("NODE_ENV", undefined);
      }
    });

    it("should exclude stack trace in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";
      
      const response = createErrorResponse(error, true);
      
      expect(response.error).toBe(true);
      expect(response.message).toBe("Test error");
      expect(response.details).toBeUndefined();
    });

    it("should include stack trace in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";
      
      const response = createErrorResponse(error, true);
      
      expect(response.error).toBe(true);
      expect(response.message).toBe("Test error");
      expect(response.details).toBeDefined();
      expect(response.details?.length).toBeLessThanOrEqual(200);
    });

    it("should handle Error objects", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";
      
      const response = createErrorResponse(error, false);
      
      expect(response.error).toBe(true);
      expect(response.message).toBe("Test error");
    });

    it("should handle string errors", () => {
      const error = "String error message";
      
      const response = createErrorResponse(error, false);
      
      expect(response.error).toBe(true);
      expect(response.message).toBe("String error message");
    });

    it("should handle unknown error types", () => {
      const error = { custom: "error object" };
      
      const response = createErrorResponse(error, false);
      
      expect(response.error).toBe(true);
      expect(response.message).toBe("Failed to complete Twitter authentication");
    });

    it("should truncate long error details", () => {
      vi.stubEnv("NODE_ENV", "development");
      
      const longStack = "A".repeat(500);
      const error = new Error("Test");
      error.stack = longStack;
      
      const response = createErrorResponse(error, true);
      
      expect(response.details).toBeDefined();
      expect(response.details?.length).toBeLessThanOrEqual(200);
    });
  });
});
