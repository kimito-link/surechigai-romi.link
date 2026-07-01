import { describe, expect, it } from "vitest";
import { shouldSkipOnboarding } from "@/lib/onboarding/skip-routes";

describe("shouldSkipOnboarding", () => {
  it("skips public share routes", () => {
    expect(shouldSkipOnboarding("/u/abc123")).toBe(true);
  });

  it("skips auth and admin routes", () => {
    expect(shouldSkipOnboarding("/sign-in")).toBe(true);
    expect(shouldSkipOnboarding("/admin/users")).toBe(true);
  });

  it("shows onboarding on main app tabs", () => {
    expect(shouldSkipOnboarding("/")).toBe(false);
    expect(shouldSkipOnboarding("/zukan")).toBe(false);
    expect(shouldSkipOnboarding("/checkin")).toBe(false);
  });
});
