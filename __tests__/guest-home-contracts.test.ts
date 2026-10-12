import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error -- 検査スクリプトは JS。コメント除去は既存のものを使う（自作しない）。
import { blankOutComments } from "../scripts/check-tracked-imports.mjs";

/**
 * トップ `/` の画面が、守るべき契約を外していないことを固定する。
 * ソースをテキストとして読んで判定する（描画せずに済む・速い）。
 *
 * ★ここで見るのは「後から崩されやすい約束」だけ。見た目の良し悪しは判定しない。
 *
 * ★★コメントを抜いてから読む:
 *   各ファイルの冒頭コメントには「absolute を使わない」「slice に戻さない」
 *   「use client を足さない」と、禁じている当のものが説明として書いてある。
 *   生のテキストに当てると、その注意書きを本物の違反として赤にしてしまう
 *   （scripts/check-tracked-imports.mjs の blankOutComments が同じ理由で作られている）。
 */

const DIR = join(process.cwd(), "apps/web/components/guest-home");
const read = (p: string): string =>
  blankOutComments(readFileSync(p, "utf8")) as string;

const PAGE = read(join(process.cwd(), "apps/web/app/page.tsx"));
const RADAR = read(join(DIR, "GuestHomeRadar.tsx"));
const CTA = read(join(DIR, "GuestHomeCta.tsx"));
const HEADER = read(join(DIR, "GuestHomeHeader.tsx"));
const HERO = read(join(DIR, "GuestHomeHero.tsx"));

const ALL_UI = [PAGE, RADAR, CTA, HEADER, HERO].join("\n");

describe("ゲストホーム: レーダーの形（2026-10-12 実損の再発防止）", () => {
  /**
   * ★実損: 本番で svg が高さ0に潰れ、図が一度も見えていなかった。
   *   親が高さを持たず、中身が position:absolute だったため。
   */
  it("★親が aspect-[] で高さを持つ（高さ0に潰れない）", () => {
    expect(RADAR).toMatch(/aspect-\[\d+\/\d+\]/);
  });

  it("★position:absolute を使わない（高さ0の再発経路を塞ぐ）", () => {
    // Tailwind の absolute クラスも、CSS の position:absolute も使わない。
    expect(RADAR).not.toMatch(/\babsolute\b/);
    expect(RADAR).not.toMatch(/position:\s*absolute/);
  });

  it("★preserveAspectRatio は meet（slice に戻すと図が切れる）", () => {
    expect(RADAR).toContain("meet");
    expect(RADAR).not.toContain("slice");
  });

  it("★viewBox の比率と aspect-[] の比率が一致する", () => {
    // ここがずれると図が切れる・余白が出る。高さ0は「極端にずれた場合」なので、
    // 比率の一致を固定すれば高さ0も自動的に防げる。
    const vb = RADAR.match(/VIEW_W\s*=\s*(\d+)[\s\S]*?VIEW_H\s*=\s*(\d+)/);
    const css = RADAR.match(/aspect-\[(\d+)\/(\d+)\]/);
    expect(vb, "VIEW_W / VIEW_H が読めない").not.toBeNull();
    expect(css, "aspect-[] が読めない").not.toBeNull();
    const vbRatio = Number(vb![1]) / Number(vb![2]);
    const cssRatio = Number(css![1]) / Number(css![2]);
    expect(cssRatio).toBeCloseTo(vbRatio, 5);
  });

  it("★同心円が viewBox に収まる（外周が切れない）", () => {
    const cy = Number(RADAR.match(/CY\s*=\s*(\d+)/)![1]);
    const h = Number(RADAR.match(/VIEW_H\s*=\s*(\d+)/)![1]);
    const radii = RADAR.match(/RADII\s*=\s*\[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    expect(radii.length).toBeGreaterThan(0);
    const max = Math.max(...radii);
    expect(cy + max, "円の下端が viewBox からはみ出す").toBeLessThanOrEqual(h);
    expect(cy - max, "円の上端が viewBox からはみ出す").toBeGreaterThanOrEqual(0);
  });

  it("★キャプションは最小幅 320px でも 12px を下回らない", () => {
    const fontSize = Number(RADAR.match(/fontSize="(\d+)"/)![1]);
    const viewW = Number(RADAR.match(/VIEW_W\s*=\s*(\d+)/)![1]);
    // SVG 内の文字は viewBox 幅に対して拡縮される。
    const effective = fontSize * (320 / viewW);
    expect(effective).toBeGreaterThanOrEqual(12);
  });
});

describe("ゲストホーム: 行き先と押しやすさ", () => {
  it("★sign-in の URL を手書きしない（定数から取る）", () => {
    // kimito で17箇所の不整合を起こした前科がある。
    expect(CTA).toContain("SIGN_IN_AUTO_X_HREF");
    expect(HEADER).toContain("SIGN_IN_AUTO_X_HREF");
    expect(ALL_UI).not.toMatch(/href=["']\/sign-in/);
  });

  it("★Contrast Contract: CTA は a/Link に背景色を直付けする", () => {
    // Pressable のような「押せる要素」の見た目に頼らない（DESIGN.md）。
    expect(CTA).toMatch(/<Link[\s\S]*?bg-kimito-blue/);
    expect(HEADER).toMatch(/<Link[\s\S]*?bg-kimito-blue/);
  });

  it("★押せる要素は 44px 以上（DESIGN.md touchTargetMin）", () => {
    // ヘッダーと紹介リンクは min-h-touch(44px)、主CTAは 48px。
    expect(HEADER).toContain("min-h-touch");
    expect(PAGE).toContain("min-h-touch");
    expect(CTA).toMatch(/min-h-\[(4[89]|[5-9]\d)px\]/);
  });
});

describe("ゲストホーム: 速さを保つ約束", () => {
  it('★"use client" を使わない（クライアント JS を出さない）', () => {
    // このページの速さは「JS を出さない」ことに依っている。
    // 1つでも足すとバンドルが生まれ、移植の目的が崩れる。
    for (const [name, src] of [
      ["page.tsx", PAGE],
      ["GuestHomeRadar", RADAR],
      ["GuestHomeCta", CTA],
      ["GuestHomeHeader", HEADER],
      ["GuestHomeHero", HERO],
    ] as const) {
      expect(src, `${name} に "use client" がある`).not.toMatch(
        /["']use client["']/,
      );
    }
  });

  it("★next/image を使わない（画像を増やさない・/_next/image の罠を避ける）", () => {
    // trailingSlash:true と next/image の組み合わせで、
    // /_next/image/ が旧 catch-all に流れて text/html が返る実損がある。
    expect(ALL_UI).not.toContain("next/image");
  });

  it("★アイコンフォントを読まない（起動に要るファイルを増やさない）", () => {
    expect(ALL_UI).not.toContain("@expo/vector-icons");
    expect(ALL_UI).not.toContain("MaterialIcons");
  });

  it("★画面の幅を JS で測らない（サーバー描画と食い違わせない）", () => {
    // useWindowDimensions は JS が動くまで確定しない。CSS のメディアクエリで出し分ける。
    expect(ALL_UI).not.toContain("useWindowDimensions");
    expect(HEADER).toMatch(/min-\[\d+px\]:/);
  });
});

describe("ゲストホーム: ログイン済みを迷子にしない", () => {
  it("★ゲートを通してから描く（ログイン済みのホームを消さない）", () => {
    // `/` はゲスト専用ではない。旧側はログイン済みにタブシェルを出している。
    expect(PAGE).toContain("decideGuestHome");
    expect(PAGE).toContain("bounce-to-legacy-shell");
    expect(PAGE).toContain("redirect(");
  });

  it("★判定はサーバーで行う（クライアントの読み込み待ちにしない）", () => {
    // 待つあいだゲスト画面が見えてしまうため。
    expect(PAGE).toContain("cookies()");
    expect(PAGE).not.toContain("useUser");
    expect(PAGE).not.toContain("useAuth");
  });
});
