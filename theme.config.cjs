/** @type {const} */
// v6.22: ダークモード専用（ライトモードは同じ値を設定）
const themeColors = {
  // KimitoLink ブランドカラー (Light Mode)
  primary: { light: '#0B3A67', dark: '#4A90D9' },      // ディープブルー
  secondary: { light: '#5A4FEA', dark: '#FF8C33' },   // パープル(アクセント)
  background: { light: '#F0F4F8', dark: '#0D1117' },  // ライトブルーグレー / ダークグレー
  surface: { light: '#FFFFFF', dark: '#161B22' },
  foreground: { light: '#0F172A', dark: '#E6EDF3' },  // スレート/ネイビーテキスト
  muted: { light: '#64748B', dark: '#6A6B6D' },
  border: { light: '#E2E8F0', dark: '#30363D' },
  success: { light: '#22C55E', dark: '#287845' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
  accent: { light: '#5A4FEA', dark: '#FF8C33' },       // パープル(アクセント)
};

module.exports = { themeColors };
