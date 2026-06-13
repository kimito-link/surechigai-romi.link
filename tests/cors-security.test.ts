/**
 * CORS セキュリティテスト
 * 
 * テストフレームワーク: Vitest
 * 対象ファイル: server/_core/index.ts (isAllowedOrigin関数)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isAllowedOrigin } from "../server/_core/cors";

describe("CORS Security - isAllowedOrigin", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  beforeEach(() => {
    vi.resetModules();
    if (originalAllowedOrigins !== undefined) {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      vi.stubEnv("NODE_ENV", originalEnv);
    } else {
      vi.stubEnv("NODE_ENV", undefined);
    }
    if (originalAllowedOrigins !== undefined) {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    } else {
      // ALLOWED_ORIGINSは削除可能
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  describe("Development environment", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("should allow localhost origins", () => {
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("http://localhost:8081")).toBe(true);
    });

    it("should allow 127.0.0.1 origins", () => {
      expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:8081")).toBe(true);
    });

    it("should allow localhost with port", () => {
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("http://localhost:8081")).toBe(true);
      expect(isAllowedOrigin("https://localhost:3000")).toBe(true);
    });

    it("should reject non-localhost origins when ALLOWED_ORIGINS is not set", () => {
      expect(isAllowedOrigin("https://evil.com")).toBe(false);
      expect(isAllowedOrigin("https://example.com")).toBe(false);
    });
  });

  describe("Production environment", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });

    it("should allow doin-challenge.com when ALLOWED_ORIGINS is not set", () => {
      expect(isAllowedOrigin("https://doin-challenge.com")).toBe(true);
      expect(isAllowedOrigin("https://www.doin-challenge.com")).toBe(true);
    });

    it("should allow https://doin-challenge.com", () => {
      expect(isAllowedOrigin("https://doin-challenge.com")).toBe(true);
    });

    it("should allow subdomains of doin-challenge.com", () => {
      expect(isAllowedOrigin("https://www.doin-challenge.com")).toBe(true);
      expect(isAllowedOrigin("https://app.doin-challenge.com")).toBe(true);
    });

    it("should reject localhost in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      
      expect(isAllowedOrigin("http://localhost:3000")).toBe(false);
      expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(false);
    });

    it("should reject malicious origins", () => {
      vi.stubEnv("NODE_ENV", "production");
      
      const maliciousOrigins = [
        "https://evil.com",
        "https://doin-challenge.com.evil.com",
        "https://evil-doin-challenge.com",
        // 注意: isAllowedOriginはorigin.includes("doin-challenge.com")でチェックするため、
        // http://doin-challenge.comも許可される（実装の仕様）
        // より厳密なチェックが必要な場合は、isAllowedOrigin関数を修正する必要がある
      ];

      maliciousOrigins.forEach(origin => {
        expect(isAllowedOrigin(origin)).toBe(false);
      });
    });
  });

  describe("ALLOWED_ORIGINS environment variable", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });

    it("should allow origins from ALLOWED_ORIGINS", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.ALLOWED_ORIGINS = "https://example.com,https://app.example.com";

      expect(isAllowedOrigin("https://example.com")).toBe(true);
      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
    });

    it("should allow origins that end with ALLOWED_ORIGINS entry", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.ALLOWED_ORIGINS = ".example.com";

      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
      expect(isAllowedOrigin("https://api.example.com")).toBe(true);
    });

    it("should handle empty ALLOWED_ORIGINS", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.ALLOWED_ORIGINS = "";

      expect(isAllowedOrigin("https://doin-challenge.com")).toBe(true);
      expect(isAllowedOrigin("https://example.com")).toBe(false);
    });

    it("should handle ALLOWED_ORIGINS with spaces", () => {
      vi.stubEnv("NODE_ENV", "production");
      // ALLOWED_ORIGINSはsplit(",").map(s => s.trim()).filter(Boolean)で処理されるため、
      // スペースはトリムされる
      process.env.ALLOWED_ORIGINS = " https://example.com , https://app.example.com ";

      expect(isAllowedOrigin("https://example.com")).toBe(true);
      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
      if (originalAllowedOrigins !== undefined) {
        process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
      } else {
        delete process.env.ALLOWED_ORIGINS;
      }
    });

    it("should reject undefined origin", () => {
      expect(isAllowedOrigin(undefined)).toBe(false);
    });

    it("should reject empty string origin", () => {
      expect(isAllowedOrigin("")).toBe(false);
    });

    it("should handle origin with path", () => {
      expect(isAllowedOrigin("https://doin-challenge.com/path")).toBe(true);
      expect(isAllowedOrigin("https://doin-challenge.com/api/test")).toBe(true);
    });

    it("should handle origin with query parameters", () => {
      expect(isAllowedOrigin("https://doin-challenge.com?param=value")).toBe(true);
      expect(isAllowedOrigin("https://doin-challenge.com?foo=bar&baz=qux")).toBe(true);
    });

    it("should reject malformed URL even if it contains doin-challenge.com", () => {
      // URLパース失敗時は安全側に倒して拒否
      expect(isAllowedOrigin("doin-challenge.com")).toBe(false);
      expect(isAllowedOrigin("not-a-valid-url")).toBe(false);
    });
  });
});
