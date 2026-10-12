import { RADAR_ARIA_LABEL, RADAR_CAPTION } from "@/lib/guest-home-copy";

/**
 * ゲストホームのレーダー図。同心円の中心が現在地、そこに封筒が届く様子。
 *
 * ★実損記録（2026-10-12 本番で実測）: この図は**本番で一度も見えていなかった**。
 *     svg: w=420 h=0 / 親: w=420 h=0
 *   旧版（components/organisms/one-tap-guest-previews.tsx）の PreviewSurface が
 *   StyleSheet.absoluteFillObject（position:absolute; inset:0）なのに、
 *   呼び出し側 post-guest-screen.tsx の previewWrap が高さを持っていなかった。
 *   子が全部 absolute だと親の高さに寄与しないので、箱ごと潰れていた。
 *
 * ★高さを足すだけでは直らない理由:
 *   旧版は viewBox 390x560（縦長）+ preserveAspectRatio="slice"。
 *   slice は「はみ出した分を切る」ので、横長の箱に入れると縦がごっそり落ちる。
 *   同心円は cy=280・r=180 で上下に ±180 必要なため、円の外周が消える。
 *   さらに封筒とキャプションは CSS の top:34% / top:58%（＝親の高さ基準）で
 *   置かれていて、SVG の座標とは無関係に動く。高さが変わるたびにズレる。
 *
 * ★直し方（この実装）:
 *   1. viewBox を 390x260（横長・比率 1.5）に作り直す。中心 cy=130、
 *      半径は元の比を保って 28/56/84（r+cy=214 で 260 に収まる）
 *   2. preserveAspectRatio="xMidYMid meet"（slice をやめる）＝図が切られない
 *   3. 親に aspect-[390/260] を与える。高さは幅から決まるので 0 にならない
 *   4. position:absolute を使わない。svg を親の直下に普通に置く
 *   5. 封筒とキャプションを SVG の中に入れる。全部が1つの座標系に乗るので、
 *      どの幅でも相対位置が崩れない
 *
 * ★禁止事項: position:absolute に戻さない／slice に戻さない／
 *   viewBox の比率と aspect-[] をずらさない。
 *   __tests__/guest-home-radar-geometry.test.ts が見張っている。
 *
 * ★色: 線は kimitoBlue の薄い版、中心点は kimitoOrange（面なので #DD6500 のまま）。
 *   キャプションは ink-muted #475569（白地で 7.0:1）。
 */

/** viewBox の寸法。CSS の aspect-[] とそろえる（テストが一致を見張る）。 */
const VIEW_W = 390;
const VIEW_H = 260;

/** 同心円の中心。 */
const CX = 195;
const CY = 130;

/** 同心円の半径（元の 60/120/180 の比を保ち、CY+最大半径 が VIEW_H に収まる値）。 */
const RADII = [28, 56, 84] as const;

/** 線の色。 */
const RING = "rgba(0, 66, 123, 0.18)";
const ROAD = "rgba(0, 66, 123, 0.10)";

export function GuestHomeRadar() {
  return (
    <div
      data-testid="guest-radar"
      className="mx-auto aspect-[390/260] w-full max-w-[420px] overflow-hidden rounded-lg border border-kimito-border-soft bg-white"
    >
      <svg
        role="img"
        aria-label={RADAR_ARIA_LABEL}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
      >
        <title>{RADAR_ARIA_LABEL}</title>

        {/* 十字の道 */}
        <line
          x1={CX}
          y1="24"
          x2={CX}
          y2={VIEW_H - 24}
          stroke={ROAD}
          strokeWidth="1"
        />
        <line
          x1="24"
          y1={CY}
          x2={VIEW_W - 24}
          y2={CY}
          stroke={ROAD}
          strokeWidth="1"
        />

        {/* 同心円 */}
        {RADII.map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={RING}
            strokeWidth="2"
          />
        ))}

        {/* 現在地 */}
        <circle cx={CX} cy={CY} r="10" fill="#dd6500" />

        {/* 届いた封筒（枠と、ふたの折り線） */}
        <g transform={`translate(${CX + 52}, ${CY - 62})`}>
          <rect
            x="0"
            y="0"
            width="34"
            height="24"
            rx="4"
            fill="#ffffff"
            stroke="#00427b"
            strokeWidth="2"
          />
          <path
            d="M2 3 L17 14 L32 3"
            fill="none"
            stroke="#00427b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* キャプション。★font-size 15 は、最小幅 320px の端末でも
            15 × (320/390) = 12.3px となり、補助テキストの最小 12px を満たす。 */}
        <text
          x={CX}
          y={VIEW_H - 22}
          textAnchor="middle"
          fontSize="15"
          fill="#475569"
          fontFamily="system-ui, sans-serif"
        >
          {RADAR_CAPTION}
        </text>
      </svg>
    </div>
  );
}
