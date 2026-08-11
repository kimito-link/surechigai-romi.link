import { describe, expect, it } from "vitest";
import { APP_ORIGIN, MARKETING_URL, STORY_URL, appUrl, shareUserUrl } from "@/lib/site-urls";
import appConfig from "@/app.config.json";

describe("site-urls", () => {
  it("exports hybrid URL constants", () => {
    expect(APP_ORIGIN).toBe("https://surechigai.kimito.link");
    expect(MARKETING_URL).toBe("https://kimito.link/surechigai/");
    expect(STORY_URL).toBe("https://kimito.link/surechigai/story/");
  });

  it("builds app and share URLs", () => {
    expect(appUrl("/checkin")).toBe("https://surechigai.kimito.link/checkin");
    expect(shareUserUrl("abc123")).toBe("https://surechigai.kimito.link/u/abc123");
  });

  it("app.config.json の本番ドメインも正規URLと一致する", () => {
    expect(appConfig.identity.productionDomain).toBe(new URL(APP_ORIGIN).hostname);
  });
});
