/** @type {const} */
// v6.22: ダークモード専用（ライトモードは同じ値を設定）
const themeColors = {
  // KimitoLink ブランドカラー（ダークモード専用）
  primary: { light: '#4A90D9', dark: '#4A90D9' },      // ブルー（メイン）
  secondary: { light: '#FF8C33', dark: '#FF8C33' },   // オレンジ（アクセント）
  background: { light: '#0D1117', dark: '#0D1117' },
  surface: { light: '#161B22', dark: '#161B22' },
  foreground: { light: '#E6EDF3', dark: '#E6EDF3' },
  muted: { light: '#6A6B6D', dark: '#6A6B6D' },
  border: { light: '#30363D', dark: '#30363D' },
  success: { light: '#287845', dark: '#287845' },
  warning: { light: '#FBBF24', dark: '#FBBF24' },
  error: { light: '#F87171', dark: '#F87171' },
  accent: { light: '#FF8C33', dark: '#FF8C33' },       // オレンジ（アクセント）
};

module.exports = { themeColors };
