import { afterEach, describe, expect, it, vi } from "vitest";

function mockJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("reverseGeocode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("同じ丸め座標の逆ジオコードをキャッシュする", async () => {
    const fetchMock = vi.fn(async () =>
      mockJsonResponse(200, {
        address: {
          province: "東京都",
          city: "渋谷区",
          neighbourhood: "道玄坂",
        },
        display_name: "道玄坂, 渋谷区, 東京都",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { reverseGeocode } =
      await import("../modules/encounter/core/geocoding.js");

    const first = await reverseGeocode(35.658581, 139.745433);
    const second = await reverseGeocode(35.658584, 139.745436);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first.prefecture).toBe("東京都");
    expect(first.municipality).toBe("渋谷区");
  });

  it("429 後はクールダウン中の外部呼び出しを抑える", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(429, {}));
    vi.stubGlobal("fetch", fetchMock);

    const { reverseGeocode } =
      await import("../modules/encounter/core/geocoding.js");

    await reverseGeocode(35.1, 139.1);
    const result = await reverseGeocode(35.2, 139.2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.areaName).toBe("不明なエリア");
  });
});
