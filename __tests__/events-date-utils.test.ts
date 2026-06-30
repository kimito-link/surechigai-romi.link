import { describe, expect, it } from "vitest";
import { toDateKey } from "@/lib/events/date-key";
import { toStartDate } from "@/lib/events/datetime-value";

describe("toDateKey", () => {
  it("formats local date as YYYY-MM-DD", () => {
    const key = toDateKey(new Date(2026, 5, 15, 12, 0, 0));
    expect(key).toBe("2026-06-15");
  });
});

describe("toStartDate", () => {
  it("builds Date from dateKey and time", () => {
    const d = toStartDate({ dateKey: "2026-06-15", hour: 20, minute: 30 });
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(5);
    expect(d?.getDate()).toBe(15);
    expect(d?.getHours()).toBe(20);
    expect(d?.getMinutes()).toBe(30);
  });
});
