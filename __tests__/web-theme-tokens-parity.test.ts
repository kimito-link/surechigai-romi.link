import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error -- 検査スクリプトは JS。コメント除去は既存のものを使う（自作しない）。
import { blankOutComments } from "../scripts/check-tracked-imports.mjs";

/**
 * Tailwind の @theme（apps/web/app/globals.css）に書いた色が、
 * 写し（apps/web/lib/brand-tokens.ts）と、その正本（theme/tokens/palette.ts）に
 * そろっていることを固定する。
 *
 * ★なぜ要るか: 移植のあいだ、色の定義が3系統になる。
 *     theme/tokens/palette.ts   … 正本（Expo 側。react-native を引き込むので直接は読めない）
 *     apps/web/lib/brand-tokens.ts … 値だけの写し（JS から参照する用）
 *     apps/web/app/globals.css   … @theme（Tailwind のクラスを生やす用） ← このテストが足す3つめ
 *   どれか1つだけ直すと、画面の一部だけ色が違う状態になる。
 *   2026-10-12 の実測では、旧側に #E2EDF7 と #F0F4F8 が混在していたのが同じ型の事故だった
 *   （docs/symptoms.md SG-09「起動のときに画面がちかちかする」）。
 *
 * ★既存の __tests__/brand-tokens-parity.test.ts は上2つを見ている。こちらは @theme を足す。
 *
 * ★ファイルをテキストとして読む理由も同じ（palette.ts を import できない）。
 */
const CANONICAL = readFileSync(
  join(process.cwd(), "theme/tokens/palette.ts"),
  "utf8",
);
const COPY = readFileSync(
  join(process.cwd(), "apps/web/lib/brand-tokens.ts"),
  "utf8",
);
const THEME = readFileSync(
  join(process.cwd(), "apps/web/app/globals.css"),
  "utf8",
);

/**
 * 「この値を書かない」系の判定に使う、コメントを抜いた中身。
 *
 * ★なぜ要るか: globals.css のコメントには「#F0F4F8 を書かないこと」「prefers-color-scheme で
 *   反転させていたのを外した」と、禁止している当のものを説明として書いてある。
 *   生のテキストに当てると、その説明文を本物の違反として赤にしてしまう
 *   （scripts/check-tracked-imports.mjs の blankOutComments が同じ理由で作られている）。
 */
const THEME_CODE: string = blankOutComments(THEME);

/** `name: "#RRGGBB"` を拾う（TS 側）。 */
function hexOf(source: string, key: string): string | null {
  const m = source.match(new RegExp(`\\b${key}\\s*:\\s*["'](#[0-9A-Fa-f]{6})`));
  return m ? m[1].toUpperCase() : null;
}

/** `--color-xxx: #RRGGBB;` を拾う（CSS 側）。 */
function cssVarOf(source: string, name: string): string | null {
  const m = source.match(
    new RegExp(`--${name}\\s*:\\s*(#[0-9A-Fa-f]{6})\\s*;`),
  );
  return m ? m[1].toUpperCase() : null;
}

/** [正本のキー, 写しのキー, @theme の変数名] */
const TRIPLETS: ReadonlyArray<readonly [string, string, string]> = [
  ["kimitoBlue", "blue", "color-kimito-blue"],
  ["kimitoBlueSoft", "blueSoft", "color-kimito-blue-soft"],
  ["kimitoOrange", "orange", "color-kimito-orange"],
  ["kimitoOrangeText", "orangeText", "color-kimito-orange-text"],
  ["kimitoBorderSoft", "borderSoft", "color-kimito-border-soft"],
];

describe("@theme: 写しと正本に色がそろっている", () => {
  it.each(TRIPLETS)(
    "%s === %s === --%s",
    (canonicalKey, copyKey, cssVarName) => {
      const canonical = hexOf(CANONICAL, canonicalKey);
      const copy = hexOf(COPY, copyKey);
      const theme = cssVarOf(THEME, cssVarName);

      // ★3つとも実在することを先に確かめる（null 同士の比較で偽の緑を作らない）。
      expect(canonical, `正本に ${canonicalKey} が無い`).toMatch(
        /^#[0-9A-F]{6}$/,
      );
      expect(copy, `写しに ${copyKey} が無い`).toMatch(/^#[0-9A-F]{6}$/);
      expect(theme, `@theme に --${cssVarName} が無い`).toMatch(
        /^#[0-9A-F]{6}$/,
      );

      expect(copy).toBe(canonical);
      expect(theme).toBe(canonical);
    },
  );

  it("★地色は #E2EDF7（起動画像・ベール・manifest と同じ1色）", () => {
    // 起動中に地色が飛ぶ事故（SG-09）を止める契約。
    expect(cssVarOf(THEME, "color-kimito-bg")).toBe("#E2EDF7");
    expect(cssVarOf(THEME, "color-kimito-bg")).toBe(
      cssVarOf(THEME, "color-kimito-blue-soft"),
    );
  });

  it("★#F0F4F8 を @theme に書かない（地色が飛ぶ）", () => {
    // コメントの注意書き（「#F0F4F8 を書かないこと」）を違反と数えないよう、
    // コメントを抜いた中身で見る。
    expect(THEME_CODE.toUpperCase()).not.toContain("#F0F4F8");
  });

  it("★ダークモードで色を反転させない（ライト単一テーマ）", () => {
    // 以前ここに prefers-color-scheme: dark で地色を #0f172a にする指定があり、
    // 暗い端末で地色が飛ぶ経路になっていた。
    expect(THEME_CODE).not.toContain("prefers-color-scheme");
    expect(THEME_CODE).toContain("color-scheme: light");
  });

  it("body に地色が当たっている（白のまま残らない）", () => {
    expect(THEME_CODE).toMatch(
      /body\s*\{[^}]*background:\s*var\(--color-kimito-bg\)/,
    );
  });
});
