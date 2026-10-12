/**
 * ブランドの色・寸法（Next.js 側）。
 *
 * ★正本は旧 Expo 側の `theme/tokens/palette.ts`。ここはその**写し**で、
 *   値を勝手に増やさない・変えない（移植が終わるまで2系統が併存するため）。
 *   ずれると「地色が飛ぶ」事故（docs/symptoms.md SG-09）の再発になる。
 *
 * ★なぜ写すのか: 旧側の palette.ts は `react-native` に依存する周辺
 *   （StyleSheet 等）と同居しており、そのまま import すると RN が Next.js 側へ
 *   引き込まれる。色の定数だけを値として持つ。
 */
export const brand = {
  /** ページ地。★起動ベール・manifest と同じ1色にそろえる（SG-09 の契約） */
  bg: "#E2EDF7",
  /** 親ブランドのネイビー */
  blue: "#00427B",
  /** 薄青サーフェス */
  blueSoft: "#E2EDF7",
  /** オレンジ（装飾用。文字には使わない） */
  orange: "#DD6500",
  /** オレンジの文字用（淡色背景で AA を満たす濃さ） */
  orangeText: "#A84B00",
  /** 淡色背景上の補助テキスト */
  inkMuted: "#334155",
  /** やわらかい境界 */
  borderSoft: "#E2E8F0",
  white: "#FFFFFF",
} as const;

/**
 * ★Contrast Contract（DESIGN.md §Contrast Contract / WCAG 2.1 AA）
 *   - `white` を `#E2EDF7` / `#FFFFFF` / 白カード上の**文字色に使わない**
 *   - 本文に `opacity < 0.75` を使わない
 *   オレンジを文字に使うときは `orangeText` を使う（`orange` は装飾のみ）。
 */
export const CONTRAST_SAFE_TEXT_ON_LIGHT = [brand.blue, brand.inkMuted, brand.orangeText] as const;
