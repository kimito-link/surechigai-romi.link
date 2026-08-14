/**
 * 写真の EXIF 解析が「取れないとき」に壊れないことを守る。
 *
 * この機能の設計上の肝は、**EXIF が取れなくても成立すること**。
 * 会議の批判役が刺した穴がまさにここで、
 *   「案Bは EXIF が必ず取得できる前提に依存している。iOS は写真アクセスを
 *     限定/拒否でき、HEIC の解析にも失敗しうる。取れないと足あとが1件も
 *     増えず、ユーザーは『機能が使えない』と判断して離脱する」
 * という指摘を受けて、取れない写真は「位置なし」として返し手動指定へ合流させる、
 * という設計にした（docs/photo-import-and-viral-DESIGN.md D章）。
 *
 * よってここで固定するのは「正しく読める」ことより
 * **「読めなくても例外を投げず、位置なしとして返す」**こと。
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ObjectURL は jsdom にも無いことがあるので毎回用意する
const createdUrls: string[] = [];
const revokedUrls: string[] = [];

beforeEach(() => {
  createdUrls.length = 0;
  revokedUrls.length = 0;
  globalThis.URL.createObjectURL = vi.fn((_blob: Blob) => {
    const u = `blob:mock/${createdUrls.length}`;
    createdUrls.push(u);
    return u;
  }) as unknown as typeof URL.createObjectURL;
  globalThis.URL.revokeObjectURL = vi.fn((u: string) => {
    revokedUrls.push(u);
  }) as unknown as typeof URL.revokeObjectURL;
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("exifr/dist/lite.esm.js");
});

/** exifr をモックしてから import する（動的 import を差し替えるため） */
async function loadWithExifr(parseImpl: (file: unknown) => Promise<unknown>) {
  vi.doMock("exifr/dist/lite.esm.js", () => ({ default: { parse: parseImpl }, parse: parseImpl }));
  return await import("@/lib/photo-exif");
}

function fakeFile(name = "IMG_0001.HEIC"): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/heic" });
}

describe("extractPhotoExif", () => {
  it("GPS と撮影日時が取れれば返す", async () => {
    const taken = new Date("2026-08-01T09:30:00Z");
    const { extractPhotoExif } = await loadWithExifr(async () => ({
      latitude: 36.011433,
      longitude: 138.18214,
      DateTimeOriginal: taken,
    }));

    const r = await extractPhotoExif(fakeFile());
    expect(r.lat).toBeCloseTo(36.011433, 5);
    expect(r.lng).toBeCloseTo(138.18214, 5);
    expect(r.takenAt?.getTime()).toBe(taken.getTime());
  });

  it("【核心】EXIF が無くても例外を投げず、位置なしで返す", async () => {
    // スクショ・SNS保存画像は EXIF が剥がされている。ごく普通に起きる。
    const { extractPhotoExif } = await loadWithExifr(async () => undefined);

    const r = await extractPhotoExif(fakeFile("screenshot.png"));
    expect(r.lat).toBeNull();
    expect(r.lng).toBeNull();
    expect(r.takenAt).toBeNull();
    expect(r.fileName).toBe("screenshot.png");
  });

  it("【核心】解析が throw しても落ちない（HEIC の解析失敗）", async () => {
    const { extractPhotoExif } = await loadWithExifr(async () => {
      throw new Error("unsupported HEIC variant");
    });

    await expect(extractPhotoExif(fakeFile())).resolves.toMatchObject({
      lat: null,
      lng: null,
    });
  });

  it("解析に失敗してもプレビューURLは作る（写真は見せたい）", async () => {
    const { extractPhotoExif } = await loadWithExifr(async () => {
      throw new Error("boom");
    });

    const r = await extractPhotoExif(fakeFile());
    expect(r.previewUrl).toBe("blob:mock/0");
  });

  it("緯度経度ちょうど0は「取れなかった」として扱う", async () => {
    // EXIF が壊れると 0,0 が入ることがある。大西洋の海上に足あとを作らない。
    const { extractPhotoExif } = await loadWithExifr(async () => ({
      latitude: 0,
      longitude: 0,
    }));

    const r = await extractPhotoExif(fakeFile());
    expect(r.lat).toBeNull();
    expect(r.lng).toBeNull();
  });

  it("範囲外の座標は捨てる", async () => {
    const { extractPhotoExif } = await loadWithExifr(async () => ({
      latitude: 999,
      longitude: 200,
    }));

    const r = await extractPhotoExif(fakeFile());
    expect(r.lat).toBeNull();
  });

  it("DateTimeOriginal が無ければ CreateDate を使う", async () => {
    const created = new Date("2026-07-15T00:00:00Z");
    const { extractPhotoExif } = await loadWithExifr(async () => ({
      latitude: 35,
      longitude: 139,
      CreateDate: created,
    }));

    const r = await extractPhotoExif(fakeFile());
    expect(r.takenAt?.getTime()).toBe(created.getTime());
  });

  it("壊れた日時は null にする（Invalid Date を通さない）", async () => {
    const { extractPhotoExif } = await loadWithExifr(async () => ({
      latitude: 35,
      longitude: 139,
      DateTimeOriginal: new Date("nonsense"),
    }));

    const r = await extractPhotoExif(fakeFile());
    expect(r.takenAt).toBeNull();
  });
});

describe("extractPhotoExifBatch", () => {
  it("1枚が失敗しても他の解析を止めない", async () => {
    let n = 0;
    const { extractPhotoExifBatch } = await loadWithExifr(async () => {
      n += 1;
      if (n === 2) throw new Error("broken file");
      return { latitude: 35 + n, longitude: 139 };
    });

    const results = await extractPhotoExifBatch([fakeFile("a"), fakeFile("b"), fakeFile("c")]);
    expect(results).toHaveLength(3);
    expect(results[0].lat).not.toBeNull();
    expect(results[1].lat).toBeNull(); // 失敗した1枚だけが位置なし
    expect(results[2].lat).not.toBeNull();
  });
});

describe("revokePreviewUrls", () => {
  it("ObjectURL を解放する（20枚のHEICでメモリを食わないため）", async () => {
    const { revokePreviewUrls } = await loadWithExifr(async () => ({}));
    revokePreviewUrls([{ previewUrl: "blob:a" }, { previewUrl: null }, { previewUrl: "blob:b" }]);
    expect(revokedUrls).toEqual(["blob:a", "blob:b"]);
  });
});
