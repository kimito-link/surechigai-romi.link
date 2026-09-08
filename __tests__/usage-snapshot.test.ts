import { describe, it, expect } from "vitest";
import {
  parseUsageCount,
  USAGE_SNAPSHOT_COUNT_KEYS,
} from "@/server/db-growth-alert";

describe("parseUsageCount", () => {
  // ★2026-09-07 に本番DBを手で数えて初めて「実ユーザー0人」と分かった。
  //   それまで誰も気づいていなかったので、日次で記録する計器を入れた。
  //   この関数はその計器の心臓部で、★「0件」と「測れなかった」を混ぜないことが仕事。

  it("PostgreSQL の COUNT が返す文字列を数値にする", () => {
    // node-postgres は bigint を文字列で返す（実測: COUNT(*) → "8"）
    expect(parseUsageCount("totalUsers", "8")).toBe(8);
    expect(parseUsageCount("totalUsers", "0")).toBe(0);
  });

  it("bigint と number も受ける", () => {
    expect(parseUsageCount("encounters", 5n)).toBe(5);
    expect(parseUsageCount("encounters", 5)).toBe(5);
  });

  // ★ここが本丸。0 に丸めると「アクティブ0人」と「SQLが壊れている」が
  //   同じ 0 として記録され、二度と区別できなくなる。
  it("測れなかった値を 0 にせず throw する", () => {
    expect(() => parseUsageCount("activeUsers7d", undefined)).toThrow();
    expect(() => parseUsageCount("activeUsers7d", null)).toThrow();
    expect(() => parseUsageCount("activeUsers7d", "abc")).toThrow();
    expect(() => parseUsageCount("activeUsers7d", NaN)).toThrow();
    expect(() => parseUsageCount("activeUsers7d", {})).toThrow();
  });

  it("throw のメッセージに列名が入る（どこが壊れたか分かる）", () => {
    expect(() => parseUsageCount("placeNotes", undefined)).toThrow(/placeNotes/);
  });

  it("数える列は9つで、重複が無い", () => {
    expect(USAGE_SNAPSHOT_COUNT_KEYS).toHaveLength(9);
    expect(new Set(USAGE_SNAPSHOT_COUNT_KEYS).size).toBe(9);
  });
});
