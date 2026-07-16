import { describe, expect, it } from "vitest";

/**
 * drizzle/schema/index.ts（Vercel Functions実行時用、.js拡張子付き）と
 * drizzle/schema/index.drizzle-kit.ts（drizzle-kit専用、拡張子なし）は
 * 手動同期の二重管理になっている（drizzle.config.ts:19-23 参照）。
 * 片方だけテーブル定義を追加/削除すると drizzle-kit と実行時でスキーマが乖離するため、
 * 両ファイルが re-export するシンボル集合が一致することをここで固定する。
 */
describe("drizzle schema index sync", () => {
  it("index.ts と index.drizzle-kit.ts が同じシンボル集合をexportする", async () => {
    const runtime = await import("../drizzle/schema/index");
    const drizzleKit = await import("../drizzle/schema/index.drizzle-kit");

    const runtimeKeys = Object.keys(runtime).sort();
    const drizzleKitKeys = Object.keys(drizzleKit).sort();

    expect(runtimeKeys.length).toBeGreaterThan(0);
    expect(drizzleKitKeys).toEqual(runtimeKeys);
  });
});
