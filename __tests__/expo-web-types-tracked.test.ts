import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Expo の Web 向け型拡張(position:"fixed" / Pressable の hovered / *.css モジュール)は
 * `/// <reference types="expo/types" />` 経由で供給される。
 *
 * この参照を持つ expo-env.d.ts は Expo の自動生成物で .gitignore 済み
 * (ファイル自身に "should be in your git ignore" と書かれている)。
 * よって CI のクリーンチェックアウトには存在せず、そこだけを頼りにすると
 * Web 向け型が丸ごと欠落して `pnpm check` が落ちる。
 * 実際に Gate 1 Check は 200 回連続 failure で、ローカルは生成済みファイルが
 * 残っているため緑に見え、7月6日以降ずっと誰も気づけなかった。
 *
 * そこで同じ参照を **追跡ファイル** types-expo-env.d.ts に置いた。
 * このテストは「追跡されている参照元が実在し、tsconfig に載っている」ことを固定する。
 * ローカルでは expo-env.d.ts があるため tsc は緑になってしまい、
 * 型チェックだけでは欠落を検出できない ＝ このテストが唯一の検出手段。
 */
describe("Expo Web 型拡張が追跡ファイルから供給される", () => {
  const root = join(__dirname, "..");

  it("types-expo-env.d.ts が expo/types を参照している", () => {
    const file = join(root, "types-expo-env.d.ts");
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toContain(
      '/// <reference types="expo/types" />',
    );
  });

  it("types-expo-env.d.ts が git に追跡されている(gitignore されていない)", () => {
    // git 管理下にあることが本質。生成物の expo-env.d.ts と違い、
    // CI のクリーンチェックアウトに存在しなければならない。
    const tracked = execFileSync(
      "git",
      ["ls-files", "--error-unmatch", "types-expo-env.d.ts"],
      { cwd: root, encoding: "utf8" },
    ).trim();
    expect(tracked).toBe("types-expo-env.d.ts");
  });

  it("tsconfig.json の include に載っている", () => {
    const tsconfig = readFileSync(join(root, "tsconfig.json"), "utf8");
    expect(JSON.parse(tsconfig).include).toContain("types-expo-env.d.ts");
  });
});
