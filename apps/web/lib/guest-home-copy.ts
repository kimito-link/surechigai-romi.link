/**
 * トップ `/` のゲスト画面に出る文言とアイコン図形。依存ゼロの定数だけ。
 *
 * ★ここに集める理由: 旧 Expo 版は文言が5つのコンポーネントに散っていて、
 *   同じ画面の中で「すれ違ひ」（旧仮名）と「すれ違い」（新仮名）が混在していた
 *   （post-guest-screen.tsx の足あと/封筒/すれ違い のラベルだけ新仮名だった）。
 *   1か所に集めて、__tests__/guest-home-copy.test.ts が表記を見張る。
 *
 * ★出典: CLAUDE.md ディレクティブ1.5 / DESIGN.md（Copy Hierarchy・Anti-Slop Checklist）。
 *   - ヒーローは「キミの／現在地／を、刻む。」の3段。「現在地」だけ橙の大文字
 *   - ★ヒーローにアプリ名を出さない（ヘッダーに既にあり繰り返しになる）
 *   - ★「すれ違ひ」は旧仮名。「すれ違い」と書かない
 *   - 説明が要る場所では「現在地でつながる、すれ違ひ通信」
 *
 * ★禁止事項:
 *   - DESIGN.md brandCopy.avoid の言い回し（近くの友達を探す / 匿名で安全にマッチング /
 *     ぼかした位置だけを保存）を使わない。「正確な場所を残す」が本アプリの価値なので逆を言うことになる
 *   - 誇張語を書かない（一覧は scripts/diff-check.config.json の forbiddenWords が正本）。
 *     scripts/diff-check.mjs は追加行しか見ないので、テスト側で恒久的に見張る
 *   - 説明文を増やして画面を埋めない（Anti-Slop）。総文字数の上限をテストで固定している
 */

/** ヒーローの3段。「現在地」だけ橙の大文字で描く（真ん中の要素）。 */
export const HERO_LINES = ["キミの", "現在地", "を、刻む。"] as const;

/** 3段に分かれた見出しを、読み上げでは1文として聞かせる。 */
export const HERO_ARIA_LABEL = "キミの現在地を刻む";

/** ヒーロー直下の1行。アプリ名は出さない。 */
export const HERO_SUB = "移動の足あとを残して、すれ違ひと聖地巡礼を";

/** ヘッダーのアプリ名（旧仮名）。 */
export const APP_NAME = "君斗りんくのすれ違ひ通信";

/** ヘッダーのログイン導線。狭い画面ではグリフだけになり「1タップ」が消える。 */
export const HEADER_LOGIN_GLYPH = "𝕏";
export const HEADER_LOGIN_TEXT = "1タップ";
export const HEADER_LOGIN_ARIA_LABEL = "Xでログイン";

/** 主 CTA。★4.3(a) 対応で確定した文言なので変えない。 */
export const CTA_LABEL = "1タップではじめる";
export const CTA_ARIA_LABEL = "Xで1タップではじめる";

/**
 * CTA の下の注記。★4.3(a) 対応で確定した文言なので変えない。
 * 旧 lib/native-app-shell.ts の loginCtaNote() の Web 側の戻り値そのまま
 * （ネイティブ側は App Store が価格表現を認めないため「無料」を外すが、Web はこちら）。
 */
export const CTA_NOTE = "無料・1タップ / 新規登録もこちら";

/** レーダー図のキャプション。 */
export const RADAR_CAPTION = "封筒が届くかも";

/** レーダー図全体の読み上げ。 */
export const RADAR_ARIA_LABEL =
  "現在地を中心にしたレーダーの図。同じ場所を通った人から封筒が届く";

/** kimito.link の紹介ページへのリンク。 */
export const MARKETING_LINK_TEXT = "kimito.link 公式の紹介ページ";
export const MARKETING_URL = "https://kimito.link/surechigai/";

/**
 * 3つの要点。
 *
 * ★旧版はここだけ「すれ違い」（新仮名）だった。DESIGN.md の指示どおり「すれ違ひ」に統一した
 *   （2026-10-12・オーナー判断）。
 * ★アイコンは Material Symbols の図形をそのまま持つ。アイコンフォントを読み込むと
 *   起動に要るファイルが増えるので、24x24 の path だけを埋め込む。
 *   出典: Material Symbols（Apache License 2.0）place / mail / groups
 */
export const BENEFITS = [
  {
    label: "足あと",
    /** place */
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
  },
  {
    label: "封筒",
    /** mail */
    path: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
  },
  {
    label: "すれ違ひ",
    /** groups（簡略化: 3人の頭と肩） */
    path: "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6.5 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  },
] as const;

/**
 * 画面に出る文言を全部つないだもの。テストが総量を見張るために使う。
 * 読み上げ専用のラベルは画面に出ないので含めない。
 */
export const ALL_VISIBLE_COPY = [
  ...HERO_LINES,
  HERO_SUB,
  APP_NAME,
  HEADER_LOGIN_GLYPH,
  HEADER_LOGIN_TEXT,
  CTA_LABEL,
  CTA_NOTE,
  RADAR_CAPTION,
  MARKETING_LINK_TEXT,
  ...BENEFITS.map((b) => b.label),
] as const;
