/**
 * 未ログインのゲスト画面にも「いまの様子」（天気・ライブカメラ）が出ることを守る。
 *
 * ★2026-08-17 に必要になった理由:
 * 天気とライブカメラはログイン後の画面にしか無く、**未ログインでは存在ごと見えなかった**
 * （ゲストの /map と /zukan は OneTapGuestShell を描くだけだった）。
 * ユーザーから「天気の機能もライブカメラの機能もどこにあるか分からない」と
 * 繰り返し指摘された。ログインしないと機能が消えるのは、使う側から見れば無いのと同じ。
 *
 * ここで守りたい失敗:
 *   1. ゲスト画面から GuestPlaceContext が外れる（また見えなくなる）
 *   2. tRPC ゲートが外れる（Provider 解決前の useQuery で画面ごと落ちる）
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

const GUEST_TABS = [
  ["軌跡タブ", "app/(tabs)/map.tsx"],
  ["図鑑タブ", "app/(tabs)/zukan.tsx"],
] as const;

describe("ゲスト画面のいまの様子", () => {
  it.each(GUEST_TABS)("%s のゲスト表示に GuestPlaceContext がある", (_name, file) => {
    const src = read(file);
    expect(src).toContain("<GuestPlaceContext />");
    expect(src).toContain('from "@/components/molecules/guest-place-context"');
  });

  it.each(GUEST_TABS)("%s はファーストビュー(heroExtra)に出す", (_name, file) => {
    /* ★2026-08-17: children に渡すと belowFold に置かれ、実測 783px＝画面外だった。
       「機能はあるが気づかれない」を繰り返さないよう heroExtra を使う。 */
    expect(read(file)).toContain("heroExtra={<GuestPlaceContext />}");
  });

  it("heroExtra はファーストビュー(ヒーロー内)に描画される", () => {
    const shell = read("components/organisms/one-tap-guest-shell.tsx");
    /* デスクトップ(heroPanel)とモバイル(heroOverlayTop)の両方に出すので2箇所ある。
       いずれも belowFold（折り返しの下＝画面外）より前にあること。 */
    const occurrences = [...shell.matchAll(/styles\.heroExtra/g)].map((m) => m.index ?? -1);
    const belowFold = shell.indexOf("styles.belowFold");
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
    for (const at of occurrences) {
      expect(at).toBeLessThan(belowFold);
    }
    // children は従来どおり belowFold 側に残っていること（役割を分けた意味が消えない）
    expect(shell).toMatch(/styles\.belowFold[\s\S]{0,80}\{children\}/);
  });

  it("tRPC Provider 未解決の間は何も描かない（画面ごと落とさない）", () => {
    const src = read("components/molecules/guest-place-context.tsx");
    // useTrpcReady のゲートを通してから useQuery を呼ぶ構造であること
    expect(src).toContain("useTrpcReady()");
    expect(src).toMatch(/if\s*\(!trpcReady\)\s*return null/);
    /* ゲートより前で useQuery を「呼んで」いないこと（呼ぶと Context 不在で throw）。
       経緯を書いたコメントにも useQuery の語は出るので、実際の呼び出し
       （trpc.….useQuery(）の位置で判定する。 */
    const gateIndex = src.indexOf("if (!trpcReady) return null");
    const callIndex = src.search(/trpc\.[\w.]+\.useQuery\(/);
    expect(gateIndex).toBeGreaterThan(-1);
    expect(callIndex).toBeGreaterThan(gateIndex);
  });

  it("フォールバック県として渡している（自分の足あとは持たない）", () => {
    const src = read("components/molecules/guest-place-context.tsx");
    expect(src).toMatch(/prefecture=\{null\}/);
    expect(src).toMatch(/fallbackPrefecture=\{prefecture\}/);
  });

  it("位置情報を新しく取らない（既存の公開クエリに相乗り）", () => {
    const src = read("components/molecules/guest-place-context.tsx");
    expect(src).toContain("zukan.activePrefectures");
    // 位置取得APIを直接呼んでいないこと
    expect(src).not.toMatch(/getCurrentPosition|expo-location/);
  });
});
