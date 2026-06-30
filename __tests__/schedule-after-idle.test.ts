import { describe, expect, it } from "vitest";
import { scheduleAfterIdle, scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";

describe("scheduleAfterIdle", () => {
  it("returns noop cancel when window is unavailable (SSR)", () => {
    const cancel = scheduleAfterIdle(() => {});
    expect(typeof cancel).toBe("function");
    expect(() => cancel()).not.toThrow();
  });
});

describe("scheduleAfterWindowLoad", () => {
  it("returns cancel function in SSR", () => {
    const cancel = scheduleAfterWindowLoad(() => {});
    expect(typeof cancel).toBe("function");
    cancel();
  });
});
