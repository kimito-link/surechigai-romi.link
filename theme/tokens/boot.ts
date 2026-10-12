/**
 * theme/tokens/boot.ts
 * 起動画面（OS の起動画面 → ブートベール → 待機画面 → 本編）の「見た目の値」の唯一の正本。
 *
 * ★なぜ1か所に集めるか（2026-10-12、Android 実機の起動録画で判明）:
 *   起動の見た目は「地色・マークの絵・大きさ・位置」が複数の場所に手書きで散っていて、
 *   ベール（app/+html.tsx）と待機画面（BrandLoadingScreen）で絵も大きさも食い違い、
 *   切り替わりのたびにアイコンが飛んで「ちかちか」に見えていた。
 *   ズレを「あとからテストで検知」するのでなく、**そもそもズレない**ように、値をここに1つだけ置き、
 *   使う側は必ずここを参照する（直書きしない。__tests__/boot-single-source.test.ts が固定している）。
 *
 * 参照している場所（直書きせず、ここから取る）:
 *   - app/+html.tsx                          ブートベールの CSS・DOM（web）
 *   - components/atoms/brand-loading-screen.tsx   Web のフルスクリーン待機（ベールと同じ絵・位置）
 * 値の一致を「テストで」固定している場所（ここから取れない・生成もしていない静的ファイル）:
 *   - public/manifest.json                   background_color / theme_color（静的 JSON。CDN 配信）
 *   - package.json                           check:pwa-splash の --expect-bg
 *   - app.config.ts                          ネイティブのスプラッシュ地 backgroundColor
 *     ★app.config.ts からこのファイルを import してはいけない（試して確認済み 2026-10-12:
 *       Expo の設定読み込みが、TS の入れ子 import を解決できず**出力なしで失敗**する）。
 *       直書きのままにして、__tests__/boot-single-source.test.ts で値を照合する。
 */
import { palette } from "./palette";

export const BOOT = {
  /**
   * 起動画面の地色。OS の起動画面（manifest.background_color から Android(WebAPK) が作る）・
   * ベール・待機画面・本体の地色をそろえる値。manifest.json の2値もこれと同じであること。
   */
  background: palette.kimitoBlueSoft,

  /** マーク（アプリのアイコンと同じ絵柄の正方形画像）。ベールが preload する。 */
  markSrc: "/boot-mark.png",

  /**
   * マークの一辺。OS の起動画面のアイコンの大きさに合わせる。
   * ★実測値: Android 実機（moto g64y／Android 15／Chrome 154 の WebAPK）で、
   *   OS の起動画面のアイコンは画面幅の 55.3%・縦中心 49.9%（2026-10-12 録画の外接矩形）。
   *   機種や OS の更新で変わりうるので、変えるときは実機で測り直す（docs/symptoms.md SG-09）。
   *   上下限（160〜260px）で挟むのは、狭い端末で潰れず大画面で巨大にならないため。
   */
  markSize: "clamp(160px, 55vw, 260px)",

  /** マークの下端からタイトルまでの間隔（マーク自体の位置には影響させない）。 */
  metaGap: "20px",

  /** マークの下に出すアプリ名。 */
  title: "君斗りんくのすれ違ひ通信",

  /** タイトルの文字色。 */
  titleColor: palette.kimitoBlue,
} as const;
