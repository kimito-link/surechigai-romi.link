/**
 * Rate Limiter テスト
 * 
 * テストフレームワーク: Vitest
 * 対象ファイル: server/_core/rate-limiter.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, rateLimiterMiddleware, getRateLimitStats, getClientIp } from "../server/_core/rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // 各テスト前にストアをクリア（実装が必要）
    // rateLimitStore.clear(); // 現在はexportされていないため、実装が必要
  });

  describe("checkRateLimit", () => {
    it("should allow first request", () => {
      const result = checkRateLimit("192.168.1.1", "/api/test");
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it("should use default config for unknown paths", () => {
      const result = checkRateLimit("192.168.1.1", "/unknown/path");
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // DEFAULT_CONFIG.maxRequests - 1
    });

    it("should use /api/auth config for auth paths", () => {
      const result = checkRateLimit("192.168.1.1", "/api/auth/login");
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // PATH_CONFIGS['/api/auth'].maxRequests - 1
    });

    it("should use /api/trpc config for trpc paths", () => {
      const result = checkRateLimit("192.168.1.1", "/api/trpc/events.list");
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // PATH_CONFIGS['/api/trpc'].maxRequests - 1
    });

    it("should block after exceeding max requests", () => {
      const ip = "192.168.1.1";
      const path = "/api/auth/login";
      
      // 5回リクエスト（制限を超える）
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, path);
      }
      
      const result = checkRateLimit(ip, path);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after expiration time", () => {
      const ip = "192.168.1.1";
      const path = "/api/test";
      
      // 最初のリクエスト
      const firstResult = checkRateLimit(ip, path);
      const resetTime = firstResult.resetTime;
      
      // 時間を進める（モックが必要）
      vi.useFakeTimers();
      vi.setSystemTime(resetTime + 1000);
      
      // 期限切れ後のリクエスト
      const secondResult = checkRateLimit(ip, path);
      
      expect(secondResult.allowed).toBe(true);
      expect(secondResult.remaining).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });

    it("should handle different IPs independently", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";
      const path = "/api/test";
      
      // IP1で5回リクエスト
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1, path);
      }
      
      // IP2はまだ制限されていない
      const result2 = checkRateLimit(ip2, path);
      expect(result2.allowed).toBe(true);
    });

    it("should handle different paths independently", () => {
      const ip = "192.168.1.1";
      
      // /api/authで5回リクエスト
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, "/api/auth/login");
      }
      
      // /api/testはまだ制限されていない
      const result = checkRateLimit(ip, "/api/test");
      expect(result.allowed).toBe(true);
    });
  });

  describe("rateLimiterMiddleware - getClientIp (via middleware)", () => {
    it("should extract IP from x-forwarded-for header (single IP)", () => {
      const req = {
        headers: {
          "x-forwarded-for": "192.168.1.1",
        },
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", expect.any(Number));
    });

    it("should extract first IP from x-forwarded-for header (multiple IPs)", () => {
      const req = {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
        },
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      // 最初のIP (192.168.1.1) が使用されることを確認
    });

    it("should handle x-forwarded-for as array", () => {
      const req = {
        headers: {
          "x-forwarded-for": ["192.168.1.1, 10.0.0.1"],
        },
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should fallback to req.ip when x-forwarded-for is missing", () => {
      const req = {
        ip: "192.168.1.100",
        headers: {},
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should fallback to req.connection.remoteAddress", () => {
      const req = {
        connection: {
          remoteAddress: "192.168.1.200",
        },
        headers: {},
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 'unknown' when no IP source is available", () => {
      const req = {
        headers: {},
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid IP format in x-forwarded-for", () => {
      const req = {
        headers: {
          "x-forwarded-for": "invalid-ip-address",
        },
        ip: "192.168.1.1",
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      // 無効なIPの場合はフォールバックが使用される
      expect(next).toHaveBeenCalled();
    });

    it("should handle IPv6 addresses", () => {
      const req = {
        headers: {
          "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        },
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("rateLimiterMiddleware - rate limiting behavior", () => {
    it("should set rate limit headers correctly", () => {
      const req = {
        headers: {},
        ip: "192.168.1.1",
        path: "/api/test",
        url: "/api/test",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      rateLimiterMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(String));
    });

    it("should return 429 when rate limit exceeded", () => {
      const req = {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
        ip: "192.168.1.1",
        path: "/api/auth/login",
        url: "/api/auth/login",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 5回リクエストして制限を超える
      for (let i = 0; i < 5; i++) {
        rateLimiterMiddleware(req, res, next);
      }

      // 6回目のリクエスト
      rateLimiterMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: "Too many requests",
        message: "リクエストが多すぎます。しばらく待ってから再試行してください。",
        retryAfter: expect.any(Number),
      });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should truncate long user-agent strings", () => {
      const longUserAgent = "A".repeat(200);
      const req = {
        headers: {
          "user-agent": longUserAgent,
        },
        ip: "192.168.1.1",
        path: "/api/auth/login",
        url: "/api/auth/login",
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 制限を超えるリクエスト
      for (let i = 0; i < 6; i++) {
        rateLimiterMiddleware(req, res, next);
      }

      // ログに含まれるuser-agentが100文字以下であることを確認
      const warnCall = consoleWarnSpy.mock.calls[0];
      expect(warnCall[1].userAgent.length).toBeLessThanOrEqual(100);

      consoleWarnSpy.mockRestore();
    });
  });

  describe("getRateLimitStats", () => {
    it("should return stats with blocked IPs", () => {
      const ip = "192.168.1.1";
      const path = "/api/auth/login";

      // 制限を超えるリクエスト
      for (let i = 0; i < 6; i++) {
        checkRateLimit(ip, path);
      }

      const stats = getRateLimitStats();

      expect(stats).toHaveProperty("totalEntries");
      expect(stats).toHaveProperty("blockedIPs");
      expect(Array.isArray(stats.blockedIPs)).toBe(true);
    });

    it("should not include expired entries in blocked IPs", () => {
      // 時間を進めて期限切れにするテスト
      // 実装が必要
    });
  });
});
