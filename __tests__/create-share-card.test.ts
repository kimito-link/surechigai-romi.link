import { describe, expect, it } from "vitest";
import {
  createFrozenShareCard,
  type ShareCardImage,
  type ShareCardRenderInput,
} from "@/lib/ogp/create-share-card";

const IKEBUKURO = "日本、〒170-0013 東京都豊島区東池袋一丁目1-2 サンシャインビル";

function deps(overrides: Partial<Parameters<typeof createFrozenShareCard>[1]> = {}) {
  const inserted: unknown[] = [];
  const base = {
    renderImage: async (_input: ShareCardRenderInput): Promise<ShareCardImage | null> => {
      throw new Error("render failed");
    },
    uploadImage: async (): Promise<string | null> => null,
    insertCard: async (row: unknown) => {
      inserted.push(row);
    },
    newId: () => "Abcd2345efgh",
    now: () => 1_700_000_000_000,
    ...overrides,
  };
  return { deps: base, inserted };
}

describe("createFrozenShareCard のフォールバック", () => {
  it("描画が失敗しても都道府県の静的画像で /s/<id> を返す", async () => {
    const { deps: d, inserted } = deps();
    const result = await createFrozenShareCard(
      {
        userId: 7,
        address: IKEBUKURO,
        area: "豊島区",
        prefecture: "東京都",
        handle: "streamerfunch",
      },
      d,
    );
    expect(result.fallback).toBe(true);
    expect(result.url).toBe("https://surechigai.kimito.link/s/Abcd2345efgh");
    expect(result.url).not.toContain("lat=");
    expect(result.areaLabel).toBe("東京都豊島区");
    expect(result.imageUrl).toBe("https://surechigai.kimito.link/og/prefectures/13.jpg");
    const row = inserted[0] as { title: string; areaText: string; imageUrl: string };
    expect(row.areaText).toBe("東京都豊島区");
    expect(row.title).toContain("東京都豊島区");
    expect(row.title).not.toContain("東池袋");
    expect(row.title).not.toContain("170-0013");
    expect(row.title).not.toContain("サンシャイン");
    expect(row.imageUrl).not.toContain("lat=");
  });

  it("Blobトークンが無くアップロードがnullなら静的画像を保存する", async () => {
    let seen: ShareCardRenderInput | null = null;
    const { deps: d, inserted } = deps({
      renderImage: async (input) => {
        seen = input;
        return { body: new Uint8Array([1, 2, 3, 4]), contentType: "image/jpeg" };
      },
      uploadImage: async () => null,
    });
    const result = await createFrozenShareCard(
      { userId: 7, address: IKEBUKURO, area: "豊島区", prefecture: "東京都" },
      d,
    );
    expect(seen).toEqual({ label: "東京都豊島区" });
    expect(JSON.stringify(seen)).not.toContain("東池袋");
    expect(JSON.stringify(seen)).not.toContain("170-0013");
    expect(result.fallback).toBe(true);
    expect(result.imageUrl).toContain("/og/prefectures/13.jpg");
    expect(inserted).toHaveLength(1);
  });

  it("DB挿入が失敗しても都道府県の静的カードURLを返す", async () => {
    const { deps: d } = deps({
      insertCard: async () => {
        throw new Error("db down");
      },
    });
    const result = await createFrozenShareCard(
      { userId: 7, prefecture: "東京都", area: "豊島区", address: IKEBUKURO },
      d,
    );
    expect(result.fallback).toBe(true);
    expect(result.url).toBe("https://surechigai.kimito.link/s/p13");
    expect(result.imageUrl).toBe("https://surechigai.kimito.link/og/prefectures/13.jpg");
    expect(result.areaLabel).toBe("東京都豊島区");
  });

  it("場所が取れないときは既定の静的カードに落とす", async () => {
    const { deps: d } = deps({
      insertCard: async () => {
        throw new Error("db down");
      },
    });
    const result = await createFrozenShareCard({ userId: 7 }, d);
    expect(result.url).toBe("https://surechigai.kimito.link/s/default");
    expect(result.imageUrl).toBe("https://surechigai.kimito.link/og-default.png");
  });

  it("描画が予算を超えたらアップロードせず静的画像を保存する", async () => {
    let uploaded = false;
    const { deps: d } = deps({
      budgetMs: 30,
      renderImage: () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ body: new Uint8Array([1]), contentType: "image/jpeg" }),
            250,
          );
        }),
      uploadImage: async () => {
        uploaded = true;
        return "https://blob.example/late.jpg";
      },
    });
    const started = Date.now();
    const result = await createFrozenShareCard(
      { userId: 1, prefecture: "長野県", area: "岡谷市" },
      d,
    );
    expect(Date.now() - started).toBeLessThan(200);
    expect(uploaded).toBe(false);
    expect(result.fallback).toBe(true);
    expect(result.imageUrl).toBe("https://surechigai.kimito.link/og/prefectures/20.jpg");
    expect(result.areaLabel).toBe("長野県岡谷市");
  });

  it("300KB超は圧縮してから保存し、圧縮後も大きければ静的画像に落とす", async () => {
    const { deps: d, inserted } = deps({
      renderImage: async () => ({ body: new Uint8Array(400_000), contentType: "image/jpeg" }),
      compressImage: async () => ({ body: new Uint8Array(2_000), contentType: "image/jpeg" }),
      uploadImage: async (_id, image) => {
        expect(image.body.byteLength).toBe(2_000);
        return "https://blob.example/card.jpg";
      },
    });
    const ok = await createFrozenShareCard({ userId: 1, prefecture: "大阪府" }, d);
    expect(ok.fallback).toBe(false);
    expect(ok.imageUrl).toBe("https://blob.example/card.jpg");

    const oversized = deps({
      renderImage: async () => ({ body: new Uint8Array(400_000), contentType: "image/jpeg" }),
      uploadImage: async () => {
        throw new Error("should not upload");
      },
    });
    const fallen = await createFrozenShareCard({ userId: 1, prefecture: "大阪府" }, oversized.deps);
    expect(fallen.fallback).toBe(true);
    expect(fallen.imageUrl).toBe("https://surechigai.kimito.link/og/prefectures/27.jpg");
    expect(oversized.inserted).toHaveLength(1);
    expect(inserted).toHaveLength(1);
  });
});
