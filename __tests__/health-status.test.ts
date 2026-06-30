import { describe, expect, it } from "vitest";
import { buildHealthStatus } from "@/lib/health-status";

describe("buildHealthStatus", () => {
  it("本番で Clerk と DB が揃っていれば ok", () => {
    const status = buildHealthStatus({
      VERCEL_ENV: "production",
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
      CLERK_SECRET_KEY: "sk_test_x",
      DATABASE_URL: "postgres://example",
    });
    expect(status.ok).toBe(true);
    expect(status.checks.authentication.status).toBe("ok");
    expect(status.checks.database.status).toBe("ok");
  });

  it("本番で DB 未設定なら misconfigured", () => {
    const status = buildHealthStatus({
      VERCEL_ENV: "production",
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
      CLERK_SECRET_KEY: "sk_test_x",
    });
    expect(status.ok).toBe(false);
    expect(status.checks.database.configured).toBe(false);
  });
});
