import { BENEFITS } from "@/lib/guest-home-copy";

/**
 * ゲストホームの要点3つ（足あと・封筒・すれ違ひ）。
 *
 * ★移植元: components/post/post-guest-screen.tsx の GUEST_HOME_BENEFITS。
 *
 * ★アイコンフォントを読まない: 旧版は @expo/vector-icons の MaterialIcons を
 *   使っていたが、フォントを読み込むと起動に要るファイルが増える（移植の目的に反する）。
 *   24x24 の path だけを lib/guest-home-copy.ts に持ち、インラインの svg で描く。
 *
 * ★旧版はここだけ「すれ違い」（新仮名）だった。「すれ違ひ」に統一済み
 *   （文言は lib/guest-home-copy.ts、表記は __tests__/guest-home-copy.test.ts が見張る）。
 *
 * ★grid を使う理由: 旧版は flex:1 + justifyContent:space-between で3等分していたが、
 *   grid-cols-3 なら gap がそのまま効き、文字数が違っても幅がそろう。
 *
 * ★色: アイコンは kimitoBlue。ラベル 12px は ink-secondary #334155
 *   （白地で 10.0:1。補助テキストの最小 12px も満たす）。
 */
export function GuestHomeBenefits() {
  return (
    <ul className="grid grid-cols-3 gap-2 px-2">
      {BENEFITS.map((benefit) => (
        <li
          key={benefit.label}
          className="flex flex-col items-center gap-1 text-center"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-kimito-blue"
          >
            <path d={benefit.path} />
          </svg>
          <span className="text-xs font-semibold text-ink-secondary">
            {benefit.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
