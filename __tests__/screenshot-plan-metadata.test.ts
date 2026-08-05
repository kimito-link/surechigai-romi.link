/**
 * App Store スクリーンショットのメタデータ規約を固定する。
 *
 * 背景（2026-08-05 Guideline 2.3.7 で却下）:
 * 5枚目が /premium を撮っており、キャプション帯の「記録と再訪は、ずっと無料」に加えて
 * 画面内に「月額の自動更新サブスクリプション」という料金セクションまで写り込んでいた。
 * Apple はスクリーンショットでの価格言及を認めておらず、「無料や割引への言及も
 * 価格表現とみなす」と明記している。
 *
 * さらに /premium の写り込みは、審査ノートで宣言している
 * 「in-app purchase なし・subscription なし」と正面から矛盾するため、
 * 放置すると次は 3.1.x 系で落ちる。撮影対象から外すこと自体を固定する。
 */
import { describe, expect, it } from "vitest";
import plan from "../store-assets/screenshot-plan.json";

/** 「無料」「割引」なども価格への言及として扱われる */
const PRICE_WORDS = [/無料/, /割引/, /free/i, /フリー/, /¥/, /\$/, /\d\s*円/];

type PublicPage = {
  slot: number;
  path: string;
  title?: string | null;
  subtitle?: string | null;
};

const publicPages = (plan as { publicPages?: PublicPage[] }).publicPages ?? [];
const framedCaptions =
  (plan as { framedCaptions?: Record<string, { headline?: string; sub?: string }> })
    .framedCaptions ?? {};

describe("screenshot-plan の価格表現", () => {
  it("撮影ページの title / subtitle に価格表現が無い", () => {
    for (const page of publicPages) {
      const text = `${page.title ?? ""} ${page.subtitle ?? ""}`;
      for (const re of PRICE_WORDS) {
        expect(text, `slot${page.slot} (${page.path}) が価格表現を含む: "${text}"`).not.toMatch(re);
      }
    }
  });

  it("キャプション帯（headline / sub）に価格表現が無い", () => {
    for (const [slot, caption] of Object.entries(framedCaptions)) {
      const text = `${caption.headline ?? ""} ${caption.sub ?? ""}`;
      for (const re of PRICE_WORDS) {
        expect(text, `caption${slot} が価格表現を含む: "${text}"`).not.toMatch(re);
      }
    }
  });

  it("課金ページ(/premium)を撮影対象にしない", () => {
    // 帯の文言を直しても、画面本体の「ずっと無料」と料金セクションが写り込む。
    const paths = publicPages.map((p) => p.path);
    expect(paths).not.toContain("/premium");
  });
});
