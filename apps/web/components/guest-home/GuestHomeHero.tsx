import { HERO_ARIA_LABEL, HERO_LINES, HERO_SUB } from "@/lib/guest-home-copy";

/**
 * ゲストホームのヒーロー。「キミの／現在地／を、刻む。」の3段。
 *
 * ★出典: CLAUDE.md ディレクティブ1.5。
 *   - 3段で、「現在地」だけ橙の大文字
 *   - ★ヒーローにアプリ名を出さない（ヘッダーに既にあり繰り返しになる）
 *   - 2026-09-11 に旧「会いたい君がいる現在地」から差し替えた。戻さないこと
 *
 * ★移植元: components/molecules/brand-tagline.tsx（react-native 版）。
 *   旧版は compact / align / lcpProminent / variant の4つの切り替えを持っていたが、
 *   このページで使う組み合わせは1つだけなので全部落とした。
 *
 * ★「現在地」の色は kimito-orange-text (#A84B00)。
 *   ブランドのオレンジ #DD6500 は地色 #E2EDF7 の上で 2.98:1 で、
 *   WCAG AA の大文字基準 3:1 にわずかに足りない（#A84B00 は 4.82:1）。
 *   #DD6500 は面・アイコンにだけ使う。
 *
 * ★3段を1つの見出しにする: span で分けると読み上げが途切れるので、
 *   h1 に aria-label を付けて1文として聞かせる。
 */
export function GuestHomeHero() {
  const [first, accent, last] = HERO_LINES;
  return (
    <section className="flex flex-col items-center gap-2 pt-2 text-center">
      <h1
        aria-label={HERO_ARIA_LABEL}
        className="flex flex-col items-center leading-tight"
      >
        <span className="text-xl font-extrabold text-kimito-blue">{first}</span>
        <span className="text-4xl font-black text-kimito-orange-text">
          {accent}
        </span>
        <span className="text-xl font-extrabold text-kimito-blue">{last}</span>
      </h1>
      <p className="text-sm text-ink-secondary">{HERO_SUB}</p>
    </section>
  );
}
