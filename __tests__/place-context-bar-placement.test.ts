/**
 * 「いまの様子」バー（天気・ライブカメラ）の配置の回帰テスト。
 *
 * この配置は 2026-08-16 に3回外している。実測した事実:
 *   1回目 足あとシートの中   → 押さないと気づけない
 *   2回目 足あと一覧の中     → ページの137%地点。スクロールしないと気づけない
 *   3回目 地図の直後         → 地図コンテナが画面高いっぱい(720px)を占めるため
 *                              その直後も画面外（実測 985px / ビューポート 720px）
 *   4回目 地図の「前」       ← 唯一ファーストビューに入る位置
 *
 * 「機能はあるが気づかれない」は無いのと同じなので、並び順をコードで固定する。
 * 地図(TabQueryShell)より後ろに動かしたらこのテストが落ちる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const TRAIL_MAP = readFileSync(resolve(ROOT, "components/organisms/web-trail-map.tsx"), "utf8");
const ZUKAN = readFileSync(
  resolve(ROOT, "components/zukan/zukan-authenticated-screen.tsx"),
  "utf8",
);

describe("いまの様子バーの配置", () => {
  it("軌跡タブ: 地図(TabQueryShell)より前にある", () => {
    const bar = TRAIL_MAP.indexOf("<PlaceContextBar");
    const map = TRAIL_MAP.indexOf("<TabQueryShell");
    expect(bar).toBeGreaterThan(-1);
    expect(map).toBeGreaterThan(-1);
    // 地図は画面高いっぱいを占めるので、後ろに置くと必ず初期表示外になる
    expect(bar).toBeLessThan(map);
  });

  it("軌跡タブ: 統計カードや履歴一覧より前にある", () => {
    const bar = TRAIL_MAP.indexOf("<PlaceContextBar");
    const stats = TRAIL_MAP.indexOf("styles.summaryRow");
    const list = TRAIL_MAP.indexOf("<TrailHistoryList");
    expect(bar).toBeLessThan(stats);
    expect(bar).toBeLessThan(list);
  });

  it("軌跡タブ: 二重に描画していない（移動したのに元を消し忘れる事故を防ぐ）", () => {
    const count = (TRAIL_MAP.match(/<PlaceContextBar/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("図鑑: 履歴一覧より前にある", () => {
    const bar = ZUKAN.indexOf("<PlaceContextBar");
    const list = ZUKAN.indexOf("<TrailHistoryList");
    expect(bar).toBeGreaterThan(-1);
    expect(bar).toBeLessThan(list);
  });

  it("軌跡タブ: 足あと0件でも描画する（locations.length > 0 で閉じない）", () => {
    // ★2026-08-16: 足あとが無いと機能ごと消えていた。「データが無いと存在しない」は
    // ユーザーから見れば無いのと同じなので、0件でもフォールバック県で出す。
    const bar = TRAIL_MAP.indexOf("<PlaceContextBar");
    // バー直前の条件式に locations.length > 0 が含まれていないこと
    const before = TRAIL_MAP.slice(Math.max(0, bar - 400), bar);
    const lastCondition = before.slice(before.lastIndexOf("{"));
    expect(lastCondition).not.toContain("locations.length > 0");
  });

  it("軌跡タブ: フォールバック県を受け取って渡している", () => {
    expect(TRAIL_MAP).toContain("fallbackPrefecture");
  });

  it("履歴一覧コンポーネントの中には置かない（一覧の中はスクロールの先）", () => {
    const listSrc = readFileSync(
      resolve(ROOT, "components/molecules/trail-history-list.tsx"),
      "utf8",
    );
    expect(listSrc).not.toContain("PlaceContextBar");
  });
});
