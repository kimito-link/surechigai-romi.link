/**
 * 封筒レール末尾の「ほか N 通」が押せる（その場で全件展開する）ことを守る。
 *
 * このテストが守る事故（2026-08-15 の調査で発見）:
 * envelope-rail.tsx:82 の moreCard が素の <View> で、隣に並ぶ EnvelopeRailCard は
 * Pressable（envelope-card.tsx:31-32）。**同じレールに同じカード型で並んでいて
 * 最後の1枚だけ押せない**という最も紛らわしい形になっていた。
 *
 * 遷移ではなくその場展開にした理由: 封筒の全件一覧ルートは存在せず
 * （EnvelopeRail はホーム画面 post-screen-view.tsx 内）、新ルートを作るより
 * 横スクロールレールをそのまま伸ばす方が最小かつ期待に合う。
 */
import { describe, expect, it } from "vitest";

import {
  visibleEnvelopes,
  ENVELOPE_RAIL_LIMIT,
} from "@/components/post/envelope-rail-visible";

const items = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

describe("visibleEnvelopes（レールの表示件数）", () => {
  it("上限を超える件数で未展開なら、上限まで表示して残りを hiddenCount にする", () => {
    const over = ENVELOPE_RAIL_LIMIT + 1;
    const result = visibleEnvelopes(items(over), false);

    expect(result.shown).toHaveLength(ENVELOPE_RAIL_LIMIT);
    expect(result.hiddenCount).toBe(1);
  });

  it("展開すると全件表示され hiddenCount が 0 になる", () => {
    const over = ENVELOPE_RAIL_LIMIT + 3;
    const result = visibleEnvelopes(items(over), true);

    expect(result.shown).toHaveLength(over);
    expect(result.hiddenCount).toBe(0);
  });

  it("上限以下なら展開状態に関わらず hiddenCount は 0（「ほかN通」を出さない）", () => {
    const under = ENVELOPE_RAIL_LIMIT;

    expect(visibleEnvelopes(items(under), false).hiddenCount).toBe(0);
    expect(visibleEnvelopes(items(under), true).hiddenCount).toBe(0);
  });

  it("空配列でも壊れない", () => {
    const result = visibleEnvelopes([], false);

    expect(result.shown).toHaveLength(0);
    expect(result.hiddenCount).toBe(0);
  });

  it("元の配列を破壊しない", () => {
    const source = items(ENVELOPE_RAIL_LIMIT + 2);
    visibleEnvelopes(source, false);

    expect(source).toHaveLength(ENVELOPE_RAIL_LIMIT + 2);
  });
});
