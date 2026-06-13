/**
 * Cookies セキュリティテスト
 * 
 * テストフレームワーク: Vitest
 * 対象ファイル: server/_core/cookies.ts
 */

import { describe, it, expect, vi } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "../server/_core/cookies";

describe("Cookies Security", () => {
  describe("getSessionCookieOptions", () => {
    it("should set secure=true for HTTPS requests", () => {
      const req = {
        protocol: "https",
        hostname: "doin-challenge.com",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.secure).toBe(true);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("lax");
    });

    it("should set secure=true for x-forwarded-proto=https", () => {
      const req = {
        protocol: "http",
        hostname: "doin-challenge.com",
        headers: {
          "x-forwarded-proto": "https",
        },
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.secure).toBe(true);
    });

    it("should set secure=false for HTTP requests", () => {
      const req = {
        protocol: "http",
        hostname: "localhost",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.secure).toBe(false);
    });

    it("should not set domain for localhost", () => {
      const req = {
        protocol: "http",
        hostname: "localhost",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });

    it("should not set domain for IP addresses", () => {
      const req = {
        protocol: "http",
        hostname: "127.0.0.1",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });

    it("should not set domain for IPv6 addresses", () => {
      const req = {
        protocol: "http",
        hostname: "::1",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });

    it("should set parent domain for subdomains", () => {
      const req = {
        protocol: "https",
        hostname: "3000-xxx.manuspre.computer",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBe(".manuspre.computer");
    });

    it("should not set domain when x-forwarded-host is present", () => {
      const req = {
        protocol: "https",
        hostname: "3000-xxx.manuspre.computer",
        headers: {
          "x-forwarded-host": "doin-challenge.com",
        },
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });

    it("should not set domain when origin header is present", () => {
      const req = {
        protocol: "https",
        hostname: "3000-xxx.manuspre.computer",
        headers: {
          origin: "https://doin-challenge.com",
        },
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });

    it("should handle x-forwarded-proto as array", () => {
      const req = {
        protocol: "http",
        hostname: "doin-challenge.com",
        headers: {
          "x-forwarded-proto": ["https", "http"],
        },
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.secure).toBe(true);
    });

    it("should handle x-forwarded-proto with comma-separated values", () => {
      const req = {
        protocol: "http",
        hostname: "doin-challenge.com",
        headers: {
          "x-forwarded-proto": "https, http",
        },
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.secure).toBe(true);
    });

    it("should handle x-forwarded-host as array", () => {
      const req = {
        protocol: "https",
        hostname: "3000-xxx.manuspre.computer",
        headers: {
          "x-forwarded-host": ["doin-challenge.com", "example.com"],
        },
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });

    it("should handle invalid origin URL", () => {
      const req = {
        protocol: "https",
        hostname: "doin-challenge.com",
        headers: {
          origin: "not-a-valid-url",
        },
      } as unknown as Request;

      // エラーが発生しないことを確認
      const options = getSessionCookieOptions(req);
      expect(options).toBeDefined();
    });

    it("should not set domain for domains with less than 3 parts", () => {
      const req = {
        protocol: "https",
        hostname: "manuspre.computer",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(req);

      expect(options.domain).toBeUndefined();
    });
  });
});
