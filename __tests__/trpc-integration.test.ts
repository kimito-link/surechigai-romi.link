/**
 * tRPC統合テスト
 * 
 * 目的: 主要なtRPCルーターが「落ちない」ことを確認
 * - events.list
 * - rankings.hosts
 * - rankings.contribution
 * 
 * これらは最低限の疎通確認であり、詳細なロジックテストではありません。
 * CI ではサーバーが立っていないため、API_URL 未設定時はスキップする。
 */

import { describe, it, expect } from "vitest";

const hasApiUrl = Boolean(process.env.CI ? process.env.API_URL : true);

describe.skipIf(!hasApiUrl)("tRPC Integration Tests", () => {
  const API_BASE = process.env.API_URL || "http://localhost:3000";

  describe("events router", () => {
    it("events.list should not crash", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/events.list`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.result).toBeDefined();
    });
  });

  describe("rankings router", () => {
    it("rankings.hosts should not crash", async () => {
      const response = await fetch(
        `${API_BASE}/api/trpc/rankings.hosts?input=${encodeURIComponent(JSON.stringify({ limit: 1 }))}`
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.result).toBeDefined();
    });

    it("rankings.contribution should not crash", async () => {
      const response = await fetch(
        `${API_BASE}/api/trpc/rankings.contribution?input=${encodeURIComponent(JSON.stringify({ period: "all", limit: 1 }))}`
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.result).toBeDefined();
    });
  });

  describe("health endpoint", () => {
    it("/api/health should return ok=true", async () => {
      const response = await fetch(`${API_BASE}/api/health`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.db.connected).toBe(true);
    });

    it("/api/health?critical=true should check critical APIs", async () => {
      const response = await fetch(`${API_BASE}/api/health?critical=true`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.critical).toBeDefined();
      expect(data.critical.homeEvents.ok).toBe(true);
      expect(data.critical.rankings.ok).toBe(true);
    });
  });
});
