import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedOrigin } from "@/server/_core/cors";

describe("CORS の既定本番オリジン", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function useDefaultProductionOrigins() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOWED_ORIGINS", "");
  }

  it("正規ドメインを許可する", () => {
    useDefaultProductionOrigins();
    expect(isAllowedOrigin("https://surechigai.kimito.link")).toBe(true);
  });

  it("恒久リダイレクト中の旧ドメインを互換用に許可する", () => {
    useDefaultProductionOrigins();
    expect(isAllowedOrigin("https://surechigai-romi.link")).toBe(true);
  });

  it("無関係な kimito.link サブドメインは暗黙に許可しない", () => {
    useDefaultProductionOrigins();
    expect(isAllowedOrigin("https://attacker.kimito.link")).toBe(false);
  });
});
