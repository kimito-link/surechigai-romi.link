/**
 * 認証済みポスト（届いたすれ違い）の重なり契約。
 * 地図の中央に空状態・吹き出し・名前を重ねない。
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast/wcag-ratio";
import { color, palette } from "@/theme/tokens";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function styleBlock(source: string, styleName: string): string {
  const start = source.indexOf(`${styleName}: {`);
  expect(start, `${styleName} が無い`).toBeGreaterThan(-1);
  return source.slice(start, start + 700);
}

describe("ポスト画面の空状態は地図の下", () => {
  const view = read("components/post/post-screen-view.tsx");
  const styles = read("components/post/post-screen-styles.ts");
  const screen = read("components/post/post-authenticated-screen.tsx");

  it("空状態カードは absolute ではなく、地図の閉じタグの後に出る", () => {
    const card = styleBlock(styles, "emptyCard");
    expect(card).not.toMatch(/position:\s*["']absolute["']/);
    expect(styleBlock(styles, "emptyCardButton")).toMatch(/minHeight:\s*44/);

    const mobile = view.slice(view.indexOf("styles.mobileScroll"));
    const mapPos = mobile.indexOf('testID="inbox-radar-map"');
    const mapClose = mobile.indexOf("</View>", mapPos);
    const emptyPos = mobile.indexOf("{emptyState}");
    expect(mapPos).toBeGreaterThan(-1);
    expect(mapClose).toBeGreaterThan(mapPos);
    expect(emptyPos).toBeGreaterThan(mapClose);

    const desktop = view.slice(view.indexOf("styles.desktopSplit"), view.indexOf("styles.mobileScroll"));
    const mapColumn = desktop.slice(0, desktop.indexOf("styles.desktopRightPane"));
    expect(mapColumn).not.toContain("{emptyState}");
    expect(desktop).toContain("{emptyState}");
  });

  it("空状態の文言とボタンはカード側にあり、地図オーバーレイ用スタイルは残っていない", () => {
    expect(screen).toContain("まだ封筒は届いていません");
    expect(screen).toContain("チェックイン画面へ");
    expect(screen).toContain('testID="inbox-empty-card"');
    expect(screen).not.toContain("emptyOverlay");
    expect(styles).not.toContain("emptyOverlay");
    expect(view).toContain('variant="focused"');
  });
});

describe("地図ピンはラベル1つ", () => {
  const marker = read("components/molecules/character-here.tsx");

  it("吹き出し「にいるよ」と名前の二段ラベルを出さない", () => {
    expect(marker).not.toContain("にいるよ");
    expect(marker).toContain("mapPinLabel");
    expect(marker.match(/<Text/g)?.length).toBe(2);
    const label = styleBlock(marker, "labelChip");
    expect(label).toContain("palette.gray900");
    expect(styleBlock(marker, "labelText")).toContain("palette.white");
  });
});

describe("ポスト画面の文字コントラスト", () => {
  it("カード・ボタン・ピンラベル・居場所バッジは 4.5:1 以上", () => {
    expect(contrastRatio(color.textPrimary, palette.white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(color.textSecondary, palette.white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.white, palette.kimitoBlue)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.white, palette.gray900)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.kimitoOrangeText, palette.white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(color.textPrimary, palette.kimitoBlueSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(color.textSecondary, palette.kimitoBlueSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#00427B", "#F8FBFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#0F172A", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
});
