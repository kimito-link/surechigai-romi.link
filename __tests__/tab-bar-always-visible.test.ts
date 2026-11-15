/**
 * ★2026-11-15 「上にスワイプすると下の固定メニューが見えなくなる」「並びが左に偏る」の再発防止。
 * - ページ全体（html/body/#root）を動かさない。スクロールは中の ScrollView だけ。
 * - タブは均等割り（maxWidth で幅を絞らない）。
 * - タブ名は行の高さを持ち、下が欠けない。
 * - Web のタブバー2種とチェックインのドックは、ホームバー分の余白（env）を同じ値で持つ。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("固定タブバーが常に見える", () => {
  it("+html はページ全体を画面に固定し、はね返りをページに伝えない", () => {
    const html = read("app/+html.tsx");
    expect(html).toMatch(/html, body \{[^}]*overflow: hidden;[^}]*overscroll-behavior: none;/);
    expect(html).toMatch(/#root \{ position: fixed; top: 0; right: 0; bottom: 0; left: 0;/);
  });

  it("(tabs) のタブは maxWidth で絞らず均等割り・ラベルに行の高さがある", () => {
    const layout = read("app/(tabs)/_layout.tsx");
    const itemStyle = layout.slice(layout.indexOf("tabBarItemStyle"), layout.indexOf("sceneStyle"));
    expect(itemStyle).not.toMatch(/maxWidth/);
    expect(layout).toMatch(/lineHeight: 15,\s*flexShrink: 0/);
  });

  it("Web のタブバー2種とドックはホームバー分の余白を共通の値で持つ", () => {
    expect(read("theme/tokens/layout.ts")).toMatch(/env\(safe-area-inset-bottom\)/);
    expect(read("app/(tabs)/_layout.tsx")).toMatch(/WEB_TAB_BAR_HEIGHT_CSS/);
    expect(read("components/organisms/web-fixed-tab-bar.tsx")).toMatch(/WEB_TAB_BAR_HEIGHT_CSS/);
    expect(read("components/checkin/checkin-screen-view.tsx")).toMatch(/bottom: WEB_TAB_BAR_HEIGHT_CSS/);
  });
});
