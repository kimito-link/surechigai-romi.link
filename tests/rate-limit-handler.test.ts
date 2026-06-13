import { describe, it, expect } from "vitest";
import {
  extractRateLimitInfo,
  calculateWaitTime,
  calculateExponentialBackoff,
} from "../server/rate-limit-handler";

describe("Rate Limit Handler", () => {
  describe("extractRateLimitInfo", () => {
    it("should extract rate limit info from headers", () => {
      const headers = new Headers({
        "x-rate-limit-limit": "900",
        "x-rate-limit-remaining": "850",
        "x-rate-limit-reset": "1704067200",
      });

      const info = extractRateLimitInfo(headers);

      expect(info).not.toBeNull();
      expect(info?.limit).toBe(900);
      expect(info?.remaining).toBe(850);
      expect(info?.reset).toBe(1704067200);
    });

    it("should return null if headers are missing", () => {
      const headers = new Headers({
        "content-type": "application/json",
      });

      const info = extractRateLimitInfo(headers);

      expect(info).toBeNull();
    });

    it("should return null if some headers are missing", () => {
      const headers = new Headers({
        "x-rate-limit-limit": "900",
        // remaining and reset are missing
      });

      const info = extractRateLimitInfo(headers);

      expect(info).toBeNull();
    });
  });

  describe("calculateWaitTime", () => {
    it("should calculate positive wait time for future reset", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 60; // 60 seconds in the future
      const waitTime = calculateWaitTime(futureTimestamp);

      // Should be approximately 61 seconds (60 + 1 buffer) in milliseconds
      expect(waitTime).toBeGreaterThan(59000);
      expect(waitTime).toBeLessThan(62000);
    });

    it("should return minimal wait time for past reset", () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 60; // 60 seconds in the past
      const waitTime = calculateWaitTime(pastTimestamp);

      // Should be 0 or 1 second (buffer)
      expect(waitTime).toBeLessThanOrEqual(1000);
    });
  });

  describe("calculateExponentialBackoff", () => {
    it("should calculate exponential delay for attempt 0", () => {
      const delay = calculateExponentialBackoff(0, 1000, 60000);

      // Base delay is 1000ms, with up to 30% jitter
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(1300);
    });

    it("should calculate exponential delay for attempt 1", () => {
      const delay = calculateExponentialBackoff(1, 1000, 60000);

      // 2^1 * 1000 = 2000ms, with up to 30% jitter
      expect(delay).toBeGreaterThanOrEqual(2000);
      expect(delay).toBeLessThanOrEqual(2600);
    });

    it("should calculate exponential delay for attempt 3", () => {
      const delay = calculateExponentialBackoff(3, 1000, 60000);

      // 2^3 * 1000 = 8000ms, with up to 30% jitter
      expect(delay).toBeGreaterThanOrEqual(8000);
      expect(delay).toBeLessThanOrEqual(10400);
    });

    it("should cap delay at maxDelayMs", () => {
      const delay = calculateExponentialBackoff(10, 1000, 60000);

      // 2^10 * 1000 = 1024000ms, but capped at 60000ms
      expect(delay).toBeLessThanOrEqual(60000);
    });

    it("should include jitter for randomness", () => {
      const delays = new Set<number>();
      
      // Run multiple times to check for randomness
      for (let i = 0; i < 10; i++) {
        delays.add(calculateExponentialBackoff(2, 1000, 60000));
      }

      // With jitter, we should get different values
      // (statistically very unlikely to get all same values)
      expect(delays.size).toBeGreaterThan(1);
    });
  });
});
