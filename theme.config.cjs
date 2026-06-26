/** @type {const} */
// kimito.link 親ブランド統一（白基調ライトUI）。surechigai はそのサテライト。
// OS のダーク設定でも見た目を一貫させるため light/dark に同じ値を入れる。
// 出典: kimitolink-linktree/tailwind.config.ts, app/globals.css
const themeColors = {
  primary: { light: '#00427B', dark: '#00427B' },      // ネイビー（kimito-blue / メイン）
  secondary: { light: '#DD6500', dark: '#DD6500' },    // オレンジ（kimito-orange / アクセント）
  background: { light: '#F0F4F8', dark: '#F0F4F8' },   // 淡いクール白（ページ地）
  surface: { light: '#FFFFFF', dark: '#FFFFFF' },      // 白（カード地）
  foreground: { light: '#0F172A', dark: '#0F172A' },   // 濃いインク（本文）
  muted: { light: '#64748B', dark: '#64748B' },        // 補助テキスト/非アクティブ（slate-500）
  border: { light: '#E2E8F0', dark: '#E2E8F0' },       // やわらかい境界（slate-200）
  success: { light: '#287845', dark: '#287845' },
  warning: { light: '#DD6500', dark: '#DD6500' },      // 黄色廃止 → オレンジ
  error: { light: '#DC2626', dark: '#DC2626' },        // 淡色背景で読める赤
  accent: { light: '#DD6500', dark: '#DD6500' },       // オレンジ（アクセント）
};

module.exports = { themeColors };
