/**
 * アプリの入口。
 *
 * ★なぜ expo-router/entry を直接 main にしないのか（2026-08-14）:
 *   h3-js はモジュールのトップレベルで new TextDecoder("utf-16le") を実行し、
 *   Hermes はこれを RangeError で弾く（詳細は lib/polyfills/text-decoder-utf16.ts）。
 *   expo-router は起動時に getRoutes() で app/ 配下の**全ルートを走査して
 *   require する**ため、app/_layout.tsx の先頭で polyfill を入れても間に合わない
 *   （_layout.tsx 自体がその走査の中で読まれるので、他のルートが先に
 *     h3-js を引き込むことがある）。
 *
 *   実測: _layout.tsx の先頭に置いた版(fa7fd4736)では iPad は起動したが
 *   iPhone は依然クラッシュした。読み込み順に依存する不安定な直し方だった。
 *
 *   よってルーターより前＝この入口で必ず適用する。ここが最初に走ることは
 *   package.json の main がこのファイルを指すことで保証される。
 */
require("./lib/bootstrap/text-decoder-init");
require("expo-router/entry");
